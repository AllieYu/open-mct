const INCR = 0, DESC = 1;
let records = [];
let displayedrecords = [];
let order = INCR;
let pwrcChecked = true;
let pwrvChecked = false;

const loadRecords = async () => {
    let date = new Date();
    let end = date.getTime();
    date.setMinutes(date.getMinutes() - 15);
    let start = date.getTime();
    console.log(start, end);
    let response = await fetch(`http://localhost:8080/history/pwr.c?start=${start}&end=${end}`);
    records = await response.json();
    displayedrecords = records;
    renderTable();
}

const renderTable = () => {
    let tbody = document.getElementById("tbody");
    if (displayedrecords.length == 0) {
        tbody.innerHTML = "";
        return;
    }

    let htmtStr = displayedrecords.map(e => {
        return `<tr><td>${e.id}</td><td>${new Date(e.timestamp).toISOString()}</td><td>${e.value}</td></tr>`
    }).reduce((a, b) => a + b);

    tbody.innerHTML = htmtStr;
}

const incrOrder = () => {
    displayedrecords.sort((a, b) => a.timestamp >= b.timestamp ? 1 : -1);
    order = INCR;
    renderTable();
}

const decOrder = () => {
    displayedrecords.sort((a, b) => b.timestamp > a.timestamp ? 1 : -1);
    order = DESC;
    renderTable();
}

const socket = new WebSocket('ws://localhost:8080/realtime');
socket.addEventListener('open', function(event) {
    console.log("socket is opend")
    socket.send('subscribe pwr.c');
});


// Listen for messages
socket.addEventListener('message', function(event) {
    const newData = JSON.parse(event.data);
    records.push(newData)
    if (pwrcChecked !== pwrvChecked)
        displayedrecords = records.filter(e => e.id === newData.id);
    else
        displayedrecords = records
    if (order === INCR)
        incrOrder();
    else {
        decOrder();
    }
});

const onPwrcChange = async (checkbox) => {
    pwrcChecked = checkbox.checked
    if (checkbox.checked == true) {
        socket.send('subscribe pwr.c');
        if (pwrvChecked == false) {
            displayedrecords = records.filter(e => e.id === 'pwr.c');
            renderTable();
        }
    } else {
        socket.send('unsubscribe pwr.c');
        if (pwrvChecked == false) {
            displayedrecords = [];
            renderTable();
        }
    }
}

const onPwrvChange = async (checkbox) => {
    pwrvChecked = checkbox.checked
    if (checkbox.checked == true) {
        socket.send('subscribe pwr.v');
        if (pwrcChecked == false) {
            displayedrecords = records.filter(e => e.id === 'pwr.v');
            renderTable();
        }
    } else {
        socket.send('unsubscribe pwr.v');
        if (pwrcChecked == false) {
            displayedrecords = [];
            renderTable();
        }
    }
}
