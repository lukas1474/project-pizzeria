import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import AmountWidget from './AmountWidget.js';



export class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.table = null;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.initActions();
  }

  getData() {
    const thisBooking = this;


    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],

      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],

      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    //console.log('getData params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
    };
    //console.log('urls', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat)
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        console.log(bookingsResponse.json);
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        //console.log(bookings);
        //console.log(eventsCurrent);
        //console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    //console.log('booked', thisBooking.booked);
    thisBooking.initFreeTable();
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      //console.log('loop', hourBlock);
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    //console.log('thisBooking.date', thisBooking.date);
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);
    //console.log('thisBooking.date', thisBooking.hourPicker.value);
    let allAvailable = false;
    thisBooking.table = null;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    const tables = thisBooking.dom.tables;
    for(let table of tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
        //console.log('tables +', parseInt(tableId));
      }

      if(
        !allAvailable
        //update ->allavailable = false
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
      table.classList.remove(classNames.booking.tableSelected);
    }
  }

  initFreeTable() {
    const thisBooking = this;
    const freeTable = [];
    const date = thisBooking.datePicker.value;
    console.log(thisBooking.booked);

    for (let hour = settings.hours.open; hour < settings.hours.close; hour += 0.5) {
      if (thisBooking.booked[date][hour]) {
        freeTable.push(thisBooking.booked[date][hour].length);
      }
    }

    console.log(freeTable);


    for (let emptyTable = 0; emptyTable < freeTable.length; emptyTable++) {
      const div = document.createElement('div');

      if (freeTable[emptyTable] <= 1) {
        div.classList.add('green');
      } else if (freeTable[emptyTable] === 2) {
        div.classList.add('orange');
      } else if (freeTable[emptyTable] >= 3) {
        div.classList.add('red');
      }

      thisBooking.dom.freeTable.appendChild(div);

    }
  }

  initActions(){
    const thisBooking = this;
    const tables = thisBooking.dom.tables;
    //console.log('tablesarray', thisBooking.dom.tables);
    //let bookedTable = '';
    for(let table of tables){
      table.addEventListener('click', function(){
        //console.log(table, 'table clicked');
        if(!table.classList.contains(classNames.booking.tableBooked)){
          //console.log(table.classList.contains(classNames.booking.tableBooked));
          const activeTable = document.querySelector('.table.' + classNames.booking.tableSelected);
          if(activeTable) activeTable.classList.remove(classNames.booking.tableSelected);
          table.classList.add(classNames.booking.tableSelected);

          thisBooking.table = table.getAttribute(settings.booking.tableIdAttribute);
        }
      });
    }

    thisBooking.hourPicker.dom.input.addEventListener('input', function() {
      if (thisBooking.table) {
        console.log('tables[bookedTable-1]', tables);
        tables[thisBooking.table-1].classList.remove(classNames.booking.tableSelected);
      }
      thisBooking.updateDOM();
    });

    thisBooking.datePicker.dom.input.addEventListener('input', function() {
      if (thisBooking.table) {
        tables[thisBooking.table-1].classList.remove(classNames.booking.tableSelected);
      }
      thisBooking.updateDOM();
    });

    thisBooking.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

  sendBooking() {
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;
    console.log('send', parseInt(thisBooking.table));
    const payload = {
      id: '',
      table: parseInt(thisBooking.table),
      date: thisBooking.datePicker.correctValue,
      hour:thisBooking.hourPicker.correctValue,
      duration: thisBooking.hoursAmount.correctValue,
      ppl: thisBooking.peopleAmount.correctValue,
      // phone: thisBooking.dom.form.phone.value,
      // adress: thisBooking.dom.form.address.value,
      repeat: false,
    };

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked == true) {
        const starterValue = starter.value;
        payload.starters.push(starterValue);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(response => response.json())
      .then(parsedResponse => {
        console.log('parsedResponse', parsedResponse);
        if (parseInt(thisBooking.table)) {

          thisBooking.makeBooked(thisBooking.date, thisBooking.hourPicker.value, thisBooking.hoursAmount.value, parseInt(thisBooking.table));
          thisBooking.updateDOM();

        } else {
          alert('please choose table');
        }
      });

  }


  render(element, tables) {
    const thisBooking = this;

    const generateHTML = templates.bookingWidget({ tables: tables });
    //console.log(generateHTML);
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;

    thisBooking.dom.wrapper.innerHTML = generateHTML;
    thisBooking.element = utils.createDOMFromHTML(generateHTML);
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    console.log('thisBooking.dom.starters', thisBooking.dom.starters);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
    thisBooking.dom.freeTable = thisBooking.dom.wrapper.querySelector('#freeTable');
    console.log(thisBooking.dom.freeTable);

  }

  initWidgets() {
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount, null, 0.5);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

  }
}

