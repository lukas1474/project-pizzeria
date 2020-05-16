import BaseWidget from './BaseWidget.js';
import utils from '../utils.js';
import { select, settings } from '../settings.js';

class DatePicker extends BaseWidget{
  constructor (wrapper){
    super(wrapper, utils.dateToStr(new Date()));
    const thisWidget = this;
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);
    thisWidget.initPlugin();
  }

  initPlugin(){
    const thisWidget = this;
    thisWidget.minDate = new Date(thisWidget.value);
    //console.log(thisWidget.minDate);
    thisWidget.maxDate = new Date(utils.addDays(thisWidget.value, settings.datePicker.maxDaysInFuture));
    //console.log(thisWidget.maxDate);

    const options = {
      dateFormat: 'd-m-Y',
      defaultDate: thisWidget.minDate,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      locale: {
        firstDayOfWeek: 1
      },
      disable: [
        function(date){
          return(date.getDay() === 1);
        }
      ],
      onChange: function(dateStr){
        thisWidget.value = dateStr;
        //console.log('thisWidget.value', thisWidget.value);
      }
    };
    flatpickr(thisWidget.dom.input, options);
  }

  parseValue(value){
    return value;
  }

  isValid(){
    return true;
  }

  renderValue(){
  }
}
export default DatePicker;
