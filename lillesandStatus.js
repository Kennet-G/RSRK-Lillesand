document.addEventListener('DOMContentLoaded', function() {
    const apiUrl = 'https://skoytestasjonapi.rs.no/prefetch/getboats';
    const updateModal = document.getElementById('updateModal');
    const updateModalBody = document.getElementById('updateModalBody');
    let alarmSound = new Audio('https://www.rsrkoslo.no/02016/status/alarm/alarm.mp3');
    let ledigSound = new Audio('https://www.rsrkoslo.no/02016/status/alarm/ledig.mp3');
    let boatStatus = {}; // Hold styr på båtstatus
    let firstLoad = true; // Variabel for å sjekke om siden lastes første gang
    let userInteracted = false; // Variabel for å holde styr på om brukeren har interagert med dokumentet

    // Funksjon for å initialisere lyder for avspilling
    function initializeSounds() {
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAgLsAAAB3AQACABAAZGF0YQAAAAA='); // En kort lyd
        silentAudio.play().then(() => {
            userInteracted = true;
            console.log('User interacted with the document.');
            // Opprett nye lydobjekter etter brukerinteraksjon
            alarmSound = new Audio('https://www.rsrkoslo.no/02016/status/alarm/alarm.mp3');
            ledigSound = new Audio('https://www.rsrkoslo.no/02016/status/alarm/ledig.mp3');
        }).catch(error => {
            console.error('Error during initial interaction:', error);
        });
    }

    // Lytt etter første brukerinteraksjon
    document.addEventListener('click', function() {
        if (!userInteracted) {
            initializeSounds();
        }
    });

    // Funksjon for å spille av lyd hvis brukeren har interagert
    function playSound(audio) {
        if (userInteracted) {
            audio.play().catch(error => {
                console.error('Error playing sound:', error);
            });
        }
    }

    // Funksjon for å hente data og oppdatere tabellen for en stasjon
    function fetchDataAndUpdateTable(apiUrl, stationName, tableBodyId) {
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                console.log(`Data from ${stationName} API:`, data); // Logg dataene hentet fra API-et
                const tableBody = document.getElementById(tableBodyId);
                tableBody.innerHTML = ''; // Fjern eksisterende rader før oppdatering

                data.rescueboats.forEach(boat => {
                    // Filtrer kun båter som tilhører den aktuelle stasjonen
                    if (boat.Station.name === stationName) {
                        const row = document.createElement('tr');

                        const cellName = document.createElement('td');
                        const nameLink = document.createElement('a');
                        nameLink.href = "#";
                        nameLink.textContent = boat.name;
                        nameLink.style.color = 'black'; // Sett tekstfarge til svart
                        nameLink.style.fontWeight = 'bold'; // Gjør teksten fet
                        nameLink.addEventListener('click', (e) => {
                            e.preventDefault();
                            openModal(boat);
                        });
                        cellName.appendChild(nameLink);
                        cellName.style.backgroundColor = getBackgroundColor(boat.extendedState.StatusText, boat.extendedState.ColorCode);
                        row.appendChild(cellName);

                        const cellStatus = document.createElement('td');
                        cellStatus.textContent = boat.extendedState.StatusText || 'I/A';
                        row.appendChild(cellStatus);

                        const cellAarsak = document.createElement('td');
                        cellAarsak.textContent = boat.extendedState.StatusAarsak || 'I/A';
                        row.appendChild(cellAarsak);

                        const cellMerknad = document.createElement('td');
                        cellMerknad.textContent = boat.extendedState.StatusMerknad || 'I/A';
                        row.appendChild(cellMerknad);

                        const cellForventetTilbake = document.createElement('td');
                        const zuluTime = boat.forventet_tilbake;
                        if (zuluTime) {
                            const date = new Date(zuluTime);
                            const options = { timeZone: 'Europe/Oslo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
                            const norskTid = new Intl.DateTimeFormat('no-NO', options).format(date);
                            cellForventetTilbake.textContent = norskTid.replace(',', ' kl:');
                        } else {
                            cellForventetTilbake.textContent = 'I/A';
                        }
                        row.appendChild(cellForventetTilbake);

                        tableBody.appendChild(row);

                        // Sjekk om statusen har endret seg
                        if (!firstLoad && (!boatStatus[boat.name] || boatStatus[boat.name] !== boat.extendedState.StatusText)) {
                            // Vis båten i oppdateringsmodulen
                            showUpdateModal(boat);
                        }

                        // Oppdater statusen for båten
                        boatStatus[boat.name] = boat.extendedState.StatusText;
                    }
                });

                // Sett firstLoad til false etter første lasting av data
                firstLoad = false;
            })
            .catch(error => {
                console.error(`Error fetching data from ${stationName} API:`, error);
            });
    }

    function showUpdateModal(boat) {
        updateModalBody.innerHTML = ''; // Fjern eksisterende innhold før oppdatering

        const row = document.createElement('tr');
        row.classList.add('blink'); // Legg til blink-animasjon

        const cellName = document.createElement('td');
        cellName.textContent = boat.name;
        cellName.style.backgroundColor = getBackgroundColor(boat.extendedState.StatusText, boat.extendedState.ColorCode);
        row.appendChild(cellName);

        const cellStatus = document.createElement('td');
        cellStatus.textContent = boat.extendedState.StatusText || 'Ingen informasjon';
        row.appendChild(cellStatus);

        const cellAarsak = document.createElement('td');
        cellAarsak.textContent = boat.extendedState.StatusAarsak || 'Ingen informasjon';
        row.appendChild(cellAarsak);

        const cellMerknad = document.createElement('td');
        cellMerknad.textContent = boat.extendedState.StatusMerknad || 'Ingen informasjon';
        row.appendChild(cellMerknad);

        const cellForventetTilbake = document.createElement('td');
        const zuluTime = boat.forventet_tilbake;
        if (zuluTime) {
            const date = new Date(zuluTime);
            const options = { timeZone: 'Europe/Oslo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
            const norskTid = new Intl.DateTimeFormat('no-NO', options).format(date);
            cellForventetTilbake.textContent = norskTid.replace(',', ' kl:');
        } else {
            cellForventetTilbake.textContent = 'Ingen informasjon';
        }
        row.appendChild(cellForventetTilbake);

        updateModalBody.appendChild(row);

        $(updateModal).modal('show');

        // Spill av riktig lyd basert på status
        if (boat.extendedState.StatusText === 'På oppdrag') {
            playSound(alarmSound);
        } else {
            playSound(ledigSound);
        }

        setTimeout(() => {
            $(updateModal).modal('hide');
        }, 10000); // Lukk modalen etter 10 sekunder
    }

    function openModal(boat) {
        // Implementer åpning av modale med detaljer for båten
        // Eksempel: document.getElementById('boatModal').modal('show');
    }

    // Funksjon for å få bakgrunnsfargen basert på status
    function getBackgroundColor(statusText, colorCode) {
        // Implementer logikk for å bestemme bakgrunnsfargen basert på status og eventuell fargekode
        switch (statusText.toLowerCase()) {
            case 'operativ':
                return '#28a745'; // Grønn farge for "operativ"
            case 'beredskap':
                return '#ffc107'; // Oransje farge for "beredskap"
            case 'uad':
                return '#dc3545'; // Rød farge for "uad"
            default:
                return colorCode || '#007bff'; // Bruk fargekoden fra API, eller blå farge som fallback
        }
    }

    // Hent og oppdater data for Lillesand ved lasting av siden
    fetchDataAndUpdateTable(apiUrl, 'Lillesand', 'lillesandTableBody');

    // Hent og oppdater data for Arendal ved lasting av siden
    const arendalApiUrl = 'https://skoytestasjonapi.rs.no/prefetch/getboats?stasjon=Arendal';
    fetchDataAndUpdateTable(arendalApiUrl, 'Arendal', 'arendalTableBody');

    // Hent og oppdater data for Kristiansand ved lasting av siden
    const kristiansandApiUrl = 'https://skoytestasjonapi.rs.no/prefetch/getboats?stasjon=Kristiansand';
    fetchDataAndUpdateTable(kristiansandApiUrl, 'Kristiansand', 'kristiansandTableBody');

    // Sett oppdatertabellen til å kjøre hvert 20. sekund for Lillesand
    setInterval(() => {
        fetchDataAndUpdateTable(apiUrl, 'Lillesand', 'lillesandTableBody');
    }, 20000);

    // Sett oppdatertabellen til å kjøre hvert 20. sekund for Arendal
    setInterval(() => {
        fetchDataAndUpdateTable(arendalApiUrl, 'Arendal', 'arendalTableBody');
    }, 20000);

    // Sett oppdatertabellen til å kjøre hvert 20. sekund for Kristiansand
    setInterval(() => {
        fetchDataAndUpdateTable(kristiansandApiUrl, 'Kristiansand', 'kristiansandTableBody');
    }, 20000);
});
