var Datepicker = (function(){
    "use strict";
    var doc = document;
    var VIEW = { "month": 1, "day" : 2};
    var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var WEEKEND_NAMES = ["日","一","二","三","四","五","六"];
    var utils = {
        dom : {
            getNode : function (ele) {
                return typeof ele === 'string' ? doc.getElementById(ele) : ele.nodeName ? ele : ele[0];
            },
            addEvent : function (ele, type, fn, useCapture) {
                var add = null;
                if (doc.addEventListener) {
                    add = function (ele, type, fn, useCapture) {
                        ele = utils.dom.getNode(ele);
                        type = type.replace(/^on/, '');
                        ele.addEventListener(type, fn, !!useCapture);
                    };
                } else if (doc.attachEvent) {
                    add = function (ele, type, fn, useCapture) {
                        ele = utils.dom.getNode(ele);
                        type = type.replace(/^on/, '');
                        ele.attachEvent('on' + type, fn);
                    };
                } else {
                    add = function (ele, type, fn, useCapture) {
                        ele = utils.dom.getNode(ele);
                        type = type.replace(/^on/, '');
                        ele['on' + type] = fn;
                    };
                }
                utils.dom.addEvent = add;
                add.apply(this, arguments);
            },
            stopPropagation : function(event){
                event = event || window.event;
                if(event.stopPropagation){
                    event.stopPropagation();
                } else {
                    event.cancelBubble = true;
                }
            },
            preventDefault: function(event){
                event = event || window.event;;
                if(event.preventDefault){
                    event.preventDefault();
                } else {
                   event.returnValue = false;
                }
            },
            hasClass : function(node, cls){
                return new RegExp('\\s+' + cls + '\\s+').test(' '+ node.className + ' ');
            },
            getOffset : function(node){
                var left = 0, top = 0;
                while(node){
                  left = node.offsetLeft + left;
                  top = node.offsetTop + top;
                  node = node.offsetParent;
                }
                return  {
                  left : left,
                  top : top
                }
            }
        },
        date : {
            formatDate2Str : function(d, pattern){
                if (!pattern) {
                    pattern = 'yyyy-MM-dd';
                }

                function replacer(patternPart, result) {
                    pattern = pattern.replace(patternPart, result);
                }

                var pad = function (source, length) {
                    var pre = "",
                        negative = (source < 0),
                        string = String(Math.abs(source));

                    if (string.length < length) {
                        pre = (new Array(length - string.length + 1)).join('0');
                    }

                    return (negative ? "-" : "") + pre + string;
                };

                var year = d.getFullYear(),
                    month = d.getMonth() + 1,
                    date2 = d.getDate(),
                    hours = d.getHours(),
                    minutes = d.getMinutes(),
                    seconds = d.getSeconds();

                replacer(/yyyy/g, pad(year, 4));
                replacer(/yy/g, pad(parseInt(year.toString().slice(2), 10), 2));
                replacer(/MM/g, pad(month, 2));
                replacer(/M/g, month);
                replacer(/dd/g, pad(date2, 2));
                replacer(/d/g, date2);

                replacer(/HH/g, pad(hours, 2));
                replacer(/H/g, hours);
                replacer(/hh/g, pad(hours % 12, 2));
                replacer(/h/g, hours % 12);
                replacer(/mm/g, pad(minutes, 2));
                replacer(/m/g, minutes);
                replacer(/ss/g, pad(seconds, 2));
                replacer(/s/g, seconds);

                return pattern;
            },
            formatStr2Date : function(d, pattern){
                var dateObj , date = new Date(), i;
                dateObj = {
                    year : date.getYear(),
                    month : date.getMonth()+1,
                    day : date.getDate(),
                    hour : date.getHours(),
                    minute : date.getMinutes(),
                    second : date.getSeconds(),
                    millseconds : 0
                };
                var repl = function(key){
                    return function(match, start){
                        var value = d.substr(start, match.length);
                        dateObj[key] = value;
                        return match;
                    }
                }
                pattern.replace(/[Yy]{2,}/g,repl('year'))
                      .replace(/M+/g, repl('month'))
                      .replace(/[Dd]+/g, repl('day'))
                      .replace(/H+/g, repl('hour'))
                      .replace(/m+/g, repl('minute'))
                      .replace(/s+/g, repl('second'));
                if(dateObj.year.length < 4){ dateObj.year = date.getFullYear().toString().slice(0,2) + '' + dateObj.year}
                return new Date(dateObj.year, dateObj.month-1, dateObj.day, dateObj.hour, dateObj.minute, dateObj.second, dateObj.millseconds);
            }
        }
    };

    var renderWeekHead = function(){
        var tr = '<tr><th class="cal-header-weekend">' + WEEKEND_NAMES[0] + '</th>', i;
        for(i = 1; i < 6; i++){
            tr = tr + '<th class="cal-header-day">' + WEEKEND_NAMES[i] + '</th>';
        }
        return tr + '<th class="cal-header-weekend">' + WEEKEND_NAMES[6] + '</th></tr>';
    };

    var renderTime = function(){
        var viewTime = this.defaultOptions.selected || this.defaultOptions.date;
        var wrap = '<div class="cal-hours">';
        wrap = wrap + '<span contentEditable="true" class="underline-editor">' +
                    (viewTime.getHours() < 10 ? '0' + viewTime.getHours() : viewTime.getHours())+ '</span>:<span contentEditable="true" class="underline-editor">' +
                    (viewTime.getMinutes() < 10 ? '0' + viewTime.getMinutes() : viewTime.getMinutes()) + '</span>:<span contentEditable="true" class="underline-editor">'+
                    (viewTime.getSeconds() < 10 ? '0' + viewTime.getSeconds(): viewTime.getSeconds()) + '</span>';
        return wrap + '</div>';
    };

    var renderDate = function(){
        var currentDate = this.defaultOptions.date, i;
        var year = currentDate.getFullYear();
        var month = currentDate.getMonth(), day = currentDate.getDate();
        var table = '<table><thead>' + renderWeekHead() + '</thead>';
        var firstDayOfMonth = new Date(year, month, 1);
        var lastDayOfMonth = new Date(year, month+1, 0);
        var lastDayofLastMonth = new Date(year, month, 0);
        var firstDayOfNextMonth = new Date(year, month+1, 1);
        var emptyFirstTD = firstDayOfMonth.getDay(), emptyLastTD = lastDayOfMonth.getDay();
        var startDate = 1, endDate = lastDayOfMonth.getDate();
        var tr = '', start, end, tdCls, weekend = 0;
        var selectedDate = this.defaultOptions.selected ? this.defaultOptions.selected.getDate() : 100;
        var hilightSelected = (this.defaultOptions.selected && this.defaultOptions.selected.getFullYear() === this.defaultOptions.date.getFullYear() && this.defaultOptions.selected.getMonth() === this.defaultOptions.date.getMonth()) ? true : false;
        for(start = startDate - emptyFirstTD, end = endDate + 6 - emptyLastTD; start <= end ;){
            tr = '<tr>';
            for (i = 0; i < 7; i++) {
                tdCls = 'cal-day';
                if (start >= startDate && start <= endDate) {
                    if(hilightSelected && start === selectedDate){ tdCls += ' cal-selected'; }
                    if(weekend%7 === 0 || weekend%7 === 6 ){ tdCls += ' cal-weekend'; }
                    if(!this.defaultOptions.limit(year, month, start)){ tdCls += ' cal-disabled';}
                    tr = tr + '<td class="' + tdCls +'">' + start + '</td>';
                } else if(start < startDate){
                    if(!this.defaultOptions.limit(lastDayofLastMonth.getFullYear(), lastDayofLastMonth.getMonth(), lastDayofLastMonth.getDate() + start)){ tdCls += ' cal-disabled';}
                    tr = tr + '<td class="' + tdCls + ' cal-prev-month-day">' + (lastDayofLastMonth.getDate() + start) + '</td>';
                } else {
                    if(!this.defaultOptions.limit(firstDayOfNextMonth.getFullYear(), firstDayOfNextMonth.getMonth(), start - endDate)){ tdCls += ' cal-disabled';}
                    tr = tr + '<td class="' + tdCls + ' cal-next-month-day">' + (start - endDate) + '</td>';
                }
                start++;
                weekend++;
            }
            tr = tr + '</tr>';
            table = table + tr;
        }
        table = table + '</table>';
        if (this.defaultOptions.hasTime) {
            table = table + renderTime.call(this);
        }
        return table;
    };

    var renderHead = function(viewModel){
        var currentDate = this.defaultOptions.date;
        var year = currentDate.getFullYear(),
            month = currentDate.getMonth() + 1;
        var text =  viewModel == VIEW.day ? year + "-" + (month<10 ? '0' + month : month) : year ;
        var head = '<div class="cal-header">' +
                        '<span class="cal-prev">&lt;</span>' +
                        '<span class="cal-next">&gt;</span>' +
                        '<span class="cal-date-text">' +  text + '</span>' +
                   '</div>';
        return head;
    };

    var renderMonth = function(){
        var currentDate = this.defaultOptions.date;
        var table = '<table>',
            month = this.defaultOptions.date.getMonth(),
            tr, i, j, cls;
        var currentMonth = 0;
        for(i = 0; i < 3; i++){
            tr = '<tr>';
            for(j = 0; j < 4; j++){
                currentMonth = i * 4 + j;
                cls = 'cal-month';
                cls = cls + (month == currentMonth ? ' cal-selected' : '');
                tr = tr + '<td class="' + cls + '" data-month="' + currentMonth + '">' + MONTH_NAMES[currentMonth]+ '</td>';
            }
            tr = tr + '</tr>';
            table = table + tr;
        }
        table = table + '</table>';
        return table;
    };

    var render = function(){
        var tableDay = renderDate.call(this),
            headDay = renderHead.call(this,VIEW.day),
            headMonth = renderHead.call(this,VIEW.month),
            tableMonth = renderMonth.call(this);
        this.holder.className = 'calendar'
        this.holder.innerHTML = '<div class="cal-day-view">' + headDay + tableDay + '</div>'+
                                '<div class="cal-month-view" style="display:none">' + headMonth + tableMonth + '</div>';
        this.dayHolder = this.holder.firstChild;
        this.monHolder = this.holder.lastChild;
    };

    var updateInput = function(){
        if(this.defaultOptions.selected){
            this.defaultOptions.ele.value = utils.date.formatDate2Str(this.defaultOptions.selected, this.defaultOptions.format);
        }
    };

    /**
     * 获取时间
     */
    var getTimeFromEle = function(){
        var time = {},
            holder = this.dayHolder.children[2];
        time.hours = +holder.children[0].innerHTML;
        time.minutes = +holder.children[1].innerHTML;
        time.seconds = +holder.children[2].innerHTML;
        return time;
    };

    var position = function(holder, refNode){
        var pos = utils.dom.getOffset(refNode);
        pos.top = refNode.offsetHeight + pos.top;
        holder.style.position = 'absolute';
        holder.style.top = (pos.top + 8)+ 'px';
        holder.style.left = pos.left + 'px';
    };

    var init = function(o, options){
        /*
         * 初始化参数
         * date 当前显示的月份
         * selected 选中的日期
         * viewModel 1表示天 2表示月
         * hasTime true表示显示时分秒 false表示不显示时分秒
         * limit 在渲染日期时的判断条件 返回true表示可选 返回false不可选
         * ele 绑定的input元素
         */
        o.defaultOptions = options;
        o.defaultOptions.date = options.date || new Date();
        o.defaultOptions.date.setDate(1);
        o.defaultOptions.format = options.format || 'yyyy-MM-dd'
        o.defaultOptions.selected = options.selected || null;
        o.defaultOptions.hasTime = options.hasTime || false;
        o.defaultOptions.limit = options.limit || function(){ return true;};
        o.defaultOptions.ele = utils.dom.getNode(options.ele);
        o.defaultOptions.listeners = {};
        o.viewModel = VIEW.day;
        o.holder = document.createElement('div');
        o.holder.style.display = 'none';
        doc.body.appendChild(o.holder);
    };

    var updateSelected = function(year, month, day){
        var time;
        if(!this.defaultOptions.selected){ this.defaultOptions.selected = new Date();}
        if (year) {
            this.defaultOptions.selected.setDate(1);
            this.defaultOptions.selected.setYear(year);
            this.defaultOptions.selected.setMonth(month);
            this.defaultOptions.selected.setDate(day);
        }
        if(this.defaultOptions.hasTime){
            time = getTimeFromEle.call(this);
            this.defaultOptions.selected.setHours(time.hours);
            this.defaultOptions.selected.setMinutes(time.minutes);
            this.defaultOptions.selected.setSeconds(time.seconds);
        }
    };

    var bindEvent = function(o){
        utils.dom.addEvent(doc, 'click', function(){
            o.hide();
        });

        utils.dom.addEvent(o.holder, 'selectstart', function(event){
            event = event || window.event;
            var target = event.target || event.srcElement;
            if((target.nodeType === 1) && !utils.dom.hasClass(target, 'underline-editor')){
                utils.dom.preventDefault(event);
            }
        });

        if (o.defaultOptions.hasTime) {
            utils.dom.addEvent(o.dayHolder, 'keydown', function(event) {
                event = event || window.event;
                var target = event.target || event.srcElement;
                if (event.keyCode === 13) {
                  updateSelected.apply(o);
                  updateInput.call(o);
                  o.fire('selected', o.defaultOptions.selected);
                  o.hide();
                } else if(event.keyCode >= 48 && event.keyCode <= 57){
                  if(target.innerHTML.replace(/^\s+/g,'').replace(/\s+$/g,'').length >=2){
                    utils.dom.preventDefault(event);
                  }
                } else if(event.keyCode != 8 && event.keyCode != 9 && (event.keyCode < 37 || event.keyCode > 40)){
                  utils.dom.preventDefault(event);
                }
            });
        }

        utils.dom.addEvent(o.dayHolder, 'click', function(event){
            event = event || window.event;
            var target = event.target || event.srcElement;
            var day, month, params;
            if(!utils.dom.hasClass(target, 'cal-disabled')){
               if(utils.dom.hasClass(target, 'cal-day')){
                   day = +target.innerHTML;
                   month = o.defaultOptions.date.getMonth();
                   if (utils.dom.hasClass(target, 'cal-prev-month-day')) {
                       month = month - 1;
                       o.defaultOptions.date.setDate(1);
                       o.defaultOptions.date.setMonth(month);
                   } else if(utils.dom.hasClass(target, 'cal-next-month-day')) {
                       month = month + 1;
                       o.defaultOptions.date.setDate(1);
                       o.defaultOptions.date.setMonth(month);
                   }
                   params = [o.defaultOptions.date.getFullYear(), o.defaultOptions.date.getMonth(), day];
                   updateSelected.apply(o, params);
                   updateInput.call(o);
                   o.fire('selected', o.defaultOptions.selected);
                   o.hide();
                   o.dayHolder.innerHTML = renderHead.call(o, VIEW.day) + renderDate.call(o);
               }else if(utils.dom.hasClass(target, 'cal-prev')){
                   o.defaultOptions.date.setMonth(o.defaultOptions.date.getMonth()-1);
                   o.dayHolder.innerHTML = renderHead.call(o, VIEW.day) + renderDate.call(o);
               }else if(utils.dom.hasClass(target, 'cal-next')){
                   o.defaultOptions.date.setMonth(o.defaultOptions.date.getMonth()+1);
                   o.dayHolder.innerHTML = renderHead.call(o, VIEW.day) + renderDate.call(o);
               }else if(utils.dom.hasClass(target, 'cal-date-text')){
                   o.viewModel = VIEW.month;
                   o.monHolder.innerHTML = renderHead.call(o, VIEW.month) + renderMonth.call(o);
                   o.dayHolder.style.display = 'none';
                   o.monHolder.style.display = 'block';
               }
            }
            utils.dom.stopPropagation(event);
        });

        utils.dom.addEvent(o.monHolder, 'click', function(event){
            event = event || window.event;
            var target = event.target || event.srcElement;
            var month;
            if(!utils.dom.hasClass(target, 'cal-disabled')){
               if(utils.dom.hasClass(target, 'cal-month')){
                   month = target.getAttribute('data-month');
                   target.className = 'cal-month cal-selected';
                   o.defaultOptions.date.setMonth(month);
                   o.viewModel = VIEW.day;
                   o.dayHolder.innerHTML = renderHead.call(o, VIEW.day) + renderDate.call(o);
                   o.monHolder.style.display = 'none';
                   o.dayHolder.style.display = 'block';
               }else if(utils.dom.hasClass(target, 'cal-prev')){
                   o.defaultOptions.date.setYear(o.defaultOptions.date.getFullYear()-1);
                   o.monHolder.firstChild.firstChild.nextSibling.nextSibling.innerHTML = o.defaultOptions.date.getFullYear();
               }else if(utils.dom.hasClass(target, 'cal-next')){
                   o.defaultOptions.date.setYear(o.defaultOptions.date.getFullYear()+1);
                   o.monHolder.firstChild.firstChild.nextSibling.nextSibling.innerHTML = o.defaultOptions.date.getFullYear();
               }
            }
            utils.dom.stopPropagation(event);
        });

        utils.dom.addEvent(o.defaultOptions.ele, 'mousedown', function(event){
            event = event || window.event;
            utils.dom.stopPropagation(event);
        });

        utils.dom.addEvent(o.defaultOptions.ele, 'click', function(event){
            var ele, indexKey;
            event = event || window.event;
            ele = event.target || event.srcElement;
            indexKey = ele.getAttribute(DATEPICKER_INDEX);
            if (indexKey) {
                o.defaultOptions = optionsMap[indexKey];
            }
            position(o.holder, o.defaultOptions.ele);
            o.show();
            utils.dom.stopPropagation(event);
        });
    };

    /**
     * 构造函数
     * @param options
     **/
    var datepicker = function(options){

        //初始化
        init(this, options);

        //绘制日历控件
        render.call(this);

        //绑定事件
        bindEvent(this);

        //定位日历控件
        position(this.holder, this.defaultOptions.ele);

    };

    var mergeDefaultOptions = function(options){
        var defaultOptions = options;
        defaultOptions.date = options.date || new Date();
        defaultOptions.date.setDate(1);
        defaultOptions.format = options.format || 'yyyy-MM-dd'
        defaultOptions.selected = options.selected || null;
        defaultOptions.hasTime = options.hasTime || false;
        defaultOptions.limit = options.limit || function(){ return true;};
        defaultOptions.ele = utils.dom.getNode(options.ele);
        defaultOptions.listeners = {};
        return defaultOptions;
    };

    var instance = null,
        optionsMap = {},
        current= 0,
        DATEPICKER_INDEX = 'data-datepickerIndex';

    /**
     * 初始化日期控件
     */
    datepicker.bind = function(options){
        var ele = utils.dom.getNode(options.ele);
        ele.setAttribute(DATEPICKER_INDEX, ++current);
        optionsMap[current] = options;
        if (!instance) {
            instance = new Datepicker(options);
        } else {
            mergeDefaultOptions(options)
            utils.dom.addEvent(ele, 'mousedown', function(event){
                event = event || window.event;
                utils.dom.stopPropagation(event);
            });

            utils.dom.addEvent(ele, 'click', function(event){
                var ele, indexKey;
                event = event || window.event;
                ele = event.target || event.srcElement;
                indexKey = ele.getAttribute(DATEPICKER_INDEX);
                if (indexKey) {
                    instance.defaultOptions = optionsMap[indexKey];
                }
                position(instance.holder, instance.defaultOptions.ele);
                instance.show();
                utils.dom.stopPropagation(event);
            });
        }
    };

    datepicker.prototype = {
        constructor : datepicker,
        listen : function(eventType, fn){
            if(!this.defaultOptions.listeners[eventType]){
                this.defaultOptions.listeners[eventType] = [];
            }
            this.defaultOptions.listeners[eventType].push(fn);
        },
        fire : function(eventType, data){
            var fns = this.defaultOptions.listeners[eventType], i;
            if(fns){
                for(i = 0; i < fns.length; i++){
                    fns[i](data);
                }
            }
        },
        show : function(){
            this.defaultOptions.date = new Date();
            this.defaultOptions.date.setDate(1);
            if (this.defaultOptions.selected) {
                this.defaultOptions.date.setYear(this.defaultOptions.selected.getFullYear());
                this.defaultOptions.date.setMonth(this.defaultOptions.selected.getMonth());
            }
            this.dayHolder.innerHTML = renderHead.call(this, VIEW.day) + renderDate.call(this);
            this.holder.style.display = 'block';
        },
        hide : function(){
            this.holder.style.display = 'none';
        },
        refresh : function(){
            this.dayHolder.innerHTML = renderHead.call(this, VIEW.day) + renderDate.call(this);
        },
        select : function(selectedDate){
            this.defaultOptions.selected = selectedDate || new Date();
            render.call(this);
        },
        getVal : function(){
            return this.defaultOptions.selected || new Date();
        }
    };

    datepicker.utils = utils;
    return datepicker;
})();
