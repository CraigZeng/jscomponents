var Datepicker = (function(){
    "use strict";
    var doc = document;
    var VIEW = {
        "month": 1,
        "day" : 2
    };
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
        }
    };

    var renderWeekHead = function(){
        var tr = '<tr><td class="cal-header-weekend">' + WEEKEND_NAMES[0] + '</td>', i;
        for(i = 1; i < 6; i++){
            tr = tr + '<td class="cal-header-day">' + WEEKEND_NAMES[i] + '</td>';
        }
        return tr + '<td class="cal-header-weekend">' + WEEKEND_NAMES[6] + '</td></tr>';
    }

    var renderDate = function(){
        var currentDate = this.date, i;
        var year = currentDate.getFullYear();
        var month = currentDate.getMonth(), day = currentDate.getDate();
        var table = '<table>' + renderWeekHead();
        var firstDayOfMonth = new Date(year, month, 1);
        var lastDayOfMonth = new Date(year, month+1, 0);
        var emptyFirstTD = firstDayOfMonth.getDay(), emptyLastTD = lastDayOfMonth.getDay();
        var startDate = 1, endDate = lastDayOfMonth.getDate();
        var tr = '', start, end, tdCls, weekend = 0;
        var selectedDate = this.selected ? this.selected.getDate() : 100;
        var hilightSelected = (this.selected && this.selected.getFullYear() === this.date.getFullYear() && this.selected.getMonth() === this.date.getMonth()) ? true : false;
        for(start = startDate - emptyFirstTD, end = endDate + 6 - emptyLastTD;start <= end ;){
            tr = '<tr>';
            for (i = 0; i < 7; i++) {
                tdCls = '';
                if (start >= startDate && start <= endDate) {
                    tdCls = 'cal-day';
                    if(hilightSelected && start === selectedDate){ tdCls += ' cal-selected'; }
                    if(weekend%7 === 0 || weekend%7 === 6 ){ tdCls += ' cal-weekend'; }
                    if(!this.limit(year, month, start)){ tdCls += ' cal-disabled';}
                    tr = tr + '<td class="' + tdCls +'">' + start + '</td>';
                } else {
                    tr = tr + '<td class="' + tdCls + '"></td>';
                }
                start++;
                weekend++;
            }
            tr = tr + '</tr>';
            table = table + tr;
        }
        table = table + '</table>';
        return table;
    };

    var renderHead = function(viewModel){
        var currentDate = this.date;
        var year = currentDate.getFullYear(),
            month = currentDate.getMonth() + 1;
        var text =  viewModel == VIEW.day ? year + "年" + (month<10 ? '0' + month : month) + "月" : year + "年";
        var head = '<div class="cal-header">' +
                        '<span class="cal-prev">&lt;</span>' + 
                        '<span class="cal-date-text">' +  text + '</span>' + 
                        '<span class="cal-next">&gt;</span>' +
                   '</div>';
        return head;
    };

    var renderMonth = function(){
        var currentDate = this.date;
        var table = '<table>', 
            month = this.date.getMonth(),
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

    var renderTime = function(){

    };

    var render = function(){
        var tableDay = renderDate.call(this),
            headDay = renderHead.call(this,VIEW.day),
            headMonth = renderHead.call(this,VIEW.month),
            tableMonth = renderMonth.call(this),
            time;
        this.holder.className = 'calendar'
        this.holder.innerHTML = '<div class="cal-day-view">' + headDay + tableDay + '</div>'+
                                '<div class="cal-month-view" style="display:none">' + headMonth + tableMonth + '</div>';
        this.dayHolder = this.holder.firstChild;
        this.monHolder = this.holder.lastChild;
    };
    
    var position = function(holder, refNode){
        var pos = utils.dom.getOffset(refNode);
        pos.top = refNode.offsetHeight + pos.top;
        holder.style.position = 'absolute';
        holder.style.top = pos.top + 'px';
        holder.style.left = pos.left + 'px';
        holder.style.display = 'none';
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
        o.date = options.date || new Date();
        o.selected = options.selected || null;
        o.viewModel = VIEW.day;
        o.hasTime = options.hasTime || false;
        o.limit = options.limit || function(){ return true;};
        o.ele = utils.dom.getNode(options.ele);
        o.listeners = {};
        o.holder = document.createElement('div');
        doc.body.appendChild(o.holder);
    };

    var updateSelected = function(year, month, day){
        if(!this.selected){ this.selected = new Date();}
        this.selected.setMonth(month);
        this.selected.setDate(day);
        this.selected.setYear(year);
    };

    var bindEvent = function(o){
        utils.dom.addEvent(doc, 'click', function(){
            o.hide();
        });

        utils.dom.addEvent(o.holder, 'selectstart', function(event){
            utils.dom.preventDefault(event);
        });

        utils.dom.addEvent(o.dayHolder, 'click', function(event){
            var target = event.target || event.srcElement;
            var day;
            if(!utils.dom.hasClass(target, 'cal-disabled')){
               if(utils.dom.hasClass(target, 'cal-day')){
                   day = +target.innerHTML;
                   updateSelected.call(o, o.date.getFullYear(), o.date.getMonth(), day);
                   o.fire('selected', o.selected);
                   o.hide();
                   o.dayHolder.innerHTML = renderHead.call(o, VIEW.day) + renderDate.call(o);
               }else if(utils.dom.hasClass(target, 'cal-prev')){
                   o.date.setMonth(o.date.getMonth()-1);
                   o.dayHolder.innerHTML = renderHead.call(o, VIEW.day) + renderDate.call(o);
               }else if(utils.dom.hasClass(target, 'cal-next')){
                   o.date.setMonth(o.date.getMonth()+1);
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
            var target = event.target || event.srcElement;
            var month;
            if(!utils.dom.hasClass(target, 'cal-disabled')){
               if(utils.dom.hasClass(target, 'cal-month')){
                   month = target.getAttribute('data-month');
                   target.className = 'cal-month cal-selected';
                   o.date.setMonth(month);
                   o.viewModel = VIEW.day;
                   o.dayHolder.innerHTML = renderHead.call(o, VIEW.day) + renderDate.call(o);
                   o.monHolder.style.display = 'none';
                   o.dayHolder.style.display = 'block'; 
               }else if(utils.dom.hasClass(target, 'cal-prev')){
                   o.date.setYear(o.date.getFullYear()-1);
                   o.monHolder.firstChild.firstChild.nextSibling.innerHTML = o.date.getFullYear() + '年';
               }else if(utils.dom.hasClass(target, 'cal-next')){
                   o.date.setYear(o.date.getFullYear()+1);
                   o.monHolder.firstChild.firstChild.nextSibling.innerHTML = o.date.getFullYear() + '年';
               }
            }
            utils.dom.stopPropagation(event);
        });

        utils.dom.addEvent(o.ele, 'mousedown', function(event){
            o.show();
            utils.dom.stopPropagation(event);
        });

        utils.dom.addEvent(o.ele, 'click', function(event){
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
        position(this.holder, this.ele);
        
    };

    datepicker.prototype = {
        constructor : datepicker,
        listen : function(eventType, fn){
            if(!this.listeners[eventType]){
                this.listeners[eventType] = [];
            }
            this.listeners[eventType].push(fn);
        },
        fire : function(eventType, data){
            var fns = this.listeners[eventType], i;
            if(fns){
                for(i = 0; i < fns.length; i++){
                    fns[i](data);
                }
            }
        },
        show : function(){
            this.holder.style.display = 'block';
        },
        hide : function(){
            this.holder.style.display = 'none';
        },
        select : function(selectedDate){
            this.selected = selectedDate || new Date();
            render.call(this);
        },
        nextMonth : function(){
            var month = this.date.getMonth();
            this.date.setMonth(month+1);
            render.call(this);
        },
        prevMonth : function(){
            var month = this.date.getMonth();
            this.date.setMonth(month-1);
            render.call(this);
        }
    };
    return datepicker;
})();