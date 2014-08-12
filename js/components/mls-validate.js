var Validator = (function(doc){
  var utils = {
    getNode : function(ele) {
      return typeof ele === 'string' ? doc.getElementById(ele) : ele.nodeName ? ele : ele[0];
    },
    typeIt : function(obj) {
      return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
    },
    addEvent : function(ele, type, fn, useCapture){
      var add = null;
      if(doc.addEventListener){
        add =  function(ele, type, fn, useCapture){
          ele = utils.getNode(ele);
          type = type.replace(/^on/,'');
          ele.addEventListener(type, fn, !!useCapture);
        } 
      }else if(doc.attachEvent){
        add =  function(ele, type, fn, useCapture){
          ele = utils.getNode(ele);
          type = type.replace(/^on/,'');
          ele.attachEvent('on' + type, fn)
        }
      }else{
        add =  function(ele, type, fn, useCapture){
          ele = utils.getNode(ele);
          type = type.replace(/^on/,'');
          ele['on' + type] = fn;
        }
      }
      utils.addEvent = add;
      add.apply(this, arguments);
    },
    series : function(params){
      var urlArr = [];
      if(params){
        for(var k in params){
          urlArr.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
        }
      }
      return urlArr.join("&");
    },
    ajax : function(url, method, params, fn, sync){
      var request = (function(){
        var fns = [
          function(){ return new XMLHttpRequest() },
          function(){ return new ActiveXObject('Msxml2.XMLHTTP')},
          function(){ return new ActiveXObject('Microsoft.XMLHTTP')}
        ];
        var i, len = fns.length;
        for(i = 0; i < len; i++){
          try{
            fns[i]();
            return fns[i];
          }catch(e){
            continue;
          }
        }
      })();
      utils.ajax = function(url, method, params, fn, sync){
        var req = request();
        method = method ?  method.toUpperCase() : 'POST';
        req.onreadystatechange = function(){
          if(req.readyState === 4 && req.status === 200){
            fn(new Function('return ' + req.responseText)());
          }
        };
        req.onerror = function(){
          result = false;
        };
        req.open(method, url + (method == 'GET' ? '?' + utils.series(params) : ''), !sync);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.send(method == 'POST' ? utils.series(params) : null);
      };
      utils.ajax.apply(this, arguments);
    }
  };
  
  var defaultRules = {
    require : function(val){
      return !/^\s*?$/.test(val);
    },
    minLen : function(val, min){
      return !!val && val.length >= min;
    },
    maxLen : function(val, max){
      return !!val && val.length <= max;
    },
    min : function(val, min){
      return !!val && +val >= min;
    },
    max : function(val, max){
      return !!val && +val <= max;
    },
    depend : function(){
      return true;
    },
    remote : function(val, options){
      if(options){
        var params = {}, result = false , fn;
        if(options.params){
          if(typeof options.params === 'function'){
            params = options.params(val);
          }else{
            params = options.params;
          }
        }
        fn = function(data){
          if(data){
            result = true;
          }else{
            result = false;
          }
          if(typeof options.callback === 'function'){
            result = !!options.callback(val);
          }
        }
        utils.ajax(options.url, 'POST', params, fn, true);
        return result;
      }
      return false;
    }
  };
  
  var Elementor = function(ele){
    this.ele = ele;
    this.rules = [];
    this.messages = {};
    this.msgNode = null;
    this.defaultMsg = '';
    this.handlers = {beforeValidate:[], afterValidate:[]};
  };
  
  Elementor.prototype = {
    addRules : function(rules) {
      if(rules){
        var i, len = rules.length;
        var rule, type, obj;
        for(i = 0; i < len; i++){
          rule = rules[i];
          type = utils.typeIt(rule);
          if(type === 'string') {
            obj = {};
            obj[rule] = true;
            this.rules.push(obj);
          }else{
            if(type === 'object'){
              this.rules.push(rule);
            }
          }
        }
      }
      return this;
    },
    addMessages : function(msgs) {
      if(msgs){
        for(var i in msgs){
          this.messages[i] = msgs[i];
        }
      }
      return this;
    },
    setMessageNode : function(ele) {
      this.msgNode = utils.getNode(ele);
      return this;
    },
    bindValidEvent : function(eventType) {
      var that = this;
      eventType = eventType || 'blur';
      utils.addEvent(that.ele, eventType, function(){
         that.validate();
      });
      return this;
    },
    updateMsg : function(flag){
      var msgNode = this.msgNode;
      if(utils.typeIt(flag) === 'boolean' && flag){
        msgNode.innerHTML = '';
        msgNode.className = 'tip tip__valid';
      }else{
        msgNode.innerHTML = this.messages[flag] || '';
        msgNode.className = 'tip tip__error';
      }
    },
    getVal : function(){
      return this.ele.value;
    },
    validate : function(){
      var that = this;
      var rules = that.rules;
      var r, fn, i, len;
      var result = true;
      var beforeHandlers = that.handlers.beforeValidate;
      var afterHandlers = that.handlers.afterValidate;
      var val = this.getVal();
      for(i = 0, len = beforeHandlers.length; i < len; i++){
        beforeHandlers[i].call(that);
      }
      for(i = 0, len = rules.length; i < len; i++){
        r = rules[i];
        for(var o in r){
          fn = r[o];
          if(utils.typeIt(fn) === 'function'){
            if(o === 'depend'){
              result = fn.call(that, val);
              if(!result) return true;
            }else{
              result = fn.call(that, val);
            }
          }else if(utils.typeIt(fn) === 'regexp'){
            result = new RegExp(fn).test(val);
          }else{
            defaultRule = defaultRules[o];
            if(defaultRule){
              result = defaultRule.call(that, val, fn);
            }
          }
          if(!result){
            that.updateMsg(o);
            return false;
          }
        }
      }
      for(i = 0, len = afterHandlers.length; i < len; i++){
        afterHandlers[i].call(that);
      }
      that.updateMsg(true);
      return result; 
    },
    beforeValidate : function(fn){
      this.listen('beforeValidate', fn);
      return this;
    },
    afterValidate : function(fn){
      this.listen('beforeValidate', fn);
      return this;
    },
    listen : function(eve, fn){
      this.handlers[eve].push(fn);
      return this;
    }
  };
  
  var Validator = function(options){
    this.elemsArr = [];
  };
  
  Validator.prototype = {
    addElement : function(ele){
      var elementor = new Elementor(utils.getNode(ele));
      elementor.bindValidEvent();
      this.elemsArr.push(elementor);
      return elementor;
    },
    validateAll : function(){
      var i, ele, len = this.elemsArr.length;
      var result = true;
      for(i = 0; i < len; i++){
        ele = this.elemsArr[i];
        if(!result || !ele.validate()){
          return false;
        }
      }
      return true;
    }
  };
  
  Validator.extendsRules = function(rules){
    if(rules){
      for(var o in rules){
        defaultRules[o] = rules[o];
      }
    }
  };
  
  return Validator;
})(document);
