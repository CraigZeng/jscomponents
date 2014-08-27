var Datepicker = (function(){
    "use strict";
    var WEEK = "";
    var doc = document;

    var utils = {
        dom : {
            getNode : function (ele) {
                return typeof ele === 'string' ? doc.getElementById(ele) : ele.nodeName ? ele : ele[0];
            },
            addEvent : function (ele, type, fn, useCapture) {
                var add = null;
                if (doc.addEventListener) {
                    add = function (ele, type, fn, useCapture) {
                        ele = utils.getNode(ele);
                        type = type.replace(/^on/, '');
                        ele.addEventListener(type, fn, !!useCapture);
                    };
                } else if (doc.attachEvent) {
                    add = function (ele, type, fn, useCapture) {
                        ele = utils.getNode(ele);
                        type = type.replace(/^on/, '');
                        ele.attachEvent('on' + type, fn);
                    };
                } else {
                    add = function (ele, type, fn, useCapture) {
                        ele = utils.getNode(ele);
                        type = type.replace(/^on/, '');
                        ele['on' + type] = fn;
                    };
                }
                utils.addEvent = add;
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
            hasClass : function(node, cls){
                return new RegExp('\\s+' + cls + '\\s+').test(' '+ node.className + ' ');
            }
        }
    };

    var renderDate = function(){
        var currentDate = this.date, i;
        var year = currentDate.getFullYear();
        var month = currentDate.getMonth(), day = currentDate.getDate();
        var table = '<table><tr><td>日</td><td>一</td><td>二</td><td>三</td><td>四</td><td>五</td><td>六</td></tr>';
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
                tdCls = 'cal-default';
                if (start >= startDate && start <= endDate) {
                    if(hilightSelected && start === selectedDate){ tdCls = 'cal-selected'; }
                    if(weekend%7 === 0 || weekend%7 === 6 ){ tdCls = 'cal-weekend'; }
                    if(!this.limit(year, month, start)){ tdCls = tdCls + ' cal-disabled';}
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

    var renderTime = function(){

    };

    var render = function(){
        var table = renderDate.call(this), time;
        if(this.hasTime){
            time = renderTime.call(this);
        }
        this.holder.innerHTML = table;
    };

    var init = function(o, options){
        /*
         * 初始化参数
         * date 当前显示的月份
         * selected 选中的日期
         * state 0表示隐藏 1表示显示
         * hasTime true表示显示时分秒 false表示不显示时分秒
         * limit 在渲染日期时的判断条件 返回true表示可选 返回false不可选
         * ele 绑定的input元素
         */
        o.date = options.date || new Date();
        o.selected = options.selected || null;
        o.state = 0;
        o.hasTime = options.hasTime || false;
        o.limit = options.limit || function(){ return true;};
        o.ele = utils.dom.getNode(options.ele);
        o.listeners = {};
        o.holder = document.createElement('div');
        o.holder.style.position = "absolute";
        doc.body.appendChild(o.holder);
    };

    var bindEvent = function(o){
        utils.dom.addEvent(document, 'click', function(){
            o.hide();
        });

        utils.dom.addEvent(o.holder, 'click', function(event){
            var target = event.target || event.srcElement;
            var day;
            if(!utils.dom.hasClass(target, 'cal-disabled')){
               day = +target.innerHTML;
               o.selected.setDate(day);
               target.className = 'cal-selected';
               o.hide();
               o.fire('selected', o.selected);
            }
            utils.dom.stopPropagation(event);
        });

        utils.dom.addEvent(o.ele, 'mousedown', function(event){
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

        //绑定事件
        bindEvent(this);

        render.call(this);
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