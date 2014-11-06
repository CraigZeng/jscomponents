var Dialog = (function(){

  var mask, container;

  var utils = {
    dom : {
        getNode : function (ele) {
            return typeof ele === 'string' ? document.getElementById(ele) : ele.nodeName ? ele : ele[0];
        },
        addEvent : function (ele, type, fn, useCapture) {
            var add = null;
            if (document.addEventListener) {
                add = function (ele, type, fn, useCapture) {
                    ele = utils.dom.getNode(ele);
                    type = type.replace(/^on/, '');
                    ele.addEventListener(type, fn, !!useCapture);
                };
            } else if (document.attachEvent) {
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
        removeEvent : function (ele, type, fn, useCapture) {
            var remove = null;
            if (document.removeEventListener) {
                remove = function (ele, type, fn, useCapture) {
                    ele = utils.dom.getNode(ele);
                    type = type.replace(/^on/, '');
                    ele.removeEventListener(type, fn, !!useCapture);
                };
            } else if (document.removeEvent) {
                remove = function (ele, type, fn, useCapture) {
                    ele = utils.dom.getNode(ele);
                    type = type.replace(/^on/, '');
                    ele.removeEvent('on' + type, fn);
                };
            } else {
                remove = function (ele, type, fn, useCapture) {
                    ele = utils.dom.getNode(ele);
                    type = type.replace(/^on/, '');
                    ele['on' + type] = null;
                };
            }
            utils.dom.removeEvent = remove;
            remove.apply(this, arguments);
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
        },
        createIframe : function(name){
            var ifm;
            try {
                ifm = document.createElement('<iframe id="' + name + '" name="'
                    + id + '" >');
            } catch (e) {
                ifm = document.createElement('iframe');
                ifm.name = ifm.id = name;
            }
            return ifm;
        },
        getViewPortSize : function(){
            var size = utils.dom.getViewPortSize.size;
            if (size) {
              return utils.dom.getViewPortSize.size;
            }
            size = {};
            size.width = document.documentElement.clientWidth || document.body.clientWidth;
            size.height = document.documentElement.clientHeight || document.body.clientHeight;
            utils.dom.getViewPortSize.size = size;
            return size;
        },
        importStyle : function(url, doc){
            doc = doc || window.document;
            var head = doc.getElementsByTagName('head')[0];
            var link = doc.createElement('link');
            link.setAttribute('rel','stylesheet');
            link.href = url;
            head.appendChild(link);
        }
    },
    tools : {
      getBtnId : function(){
          return 'btn-' + (Math.random() * 1000000).toFixed(0);
      },
      extends : function(data, def){
          if (def) {
            for (var key in def) {
               if(data[key] == null) {
                  data[key] = def[key];
               }
            }
          }
          return data;
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
        utils.tools.ajax = function(url, method, params, fn, sync){
          var req = request();
          method = method ?  method.toUpperCase() : 'POST';
          req.onreadystatechange = function(){
            if(req.readyState === 4 && req.status === 200){
              fn(req.responseText);
            }
          };
          req.onerror = function(){
            result = false;
          };
          req.open(method, url + (method == 'GET' ? '?' + utils.tools.series(params) : ''), !sync);
          req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
          req.send(method == 'POST' ? utils.tools.series(params) : null);
        };
        utils.tools.ajax.apply(this, arguments);
      }
    }
  };


  /**
   * DEFAULT_HEADER 默认头部模板
   * DEFAULT_FOOTER 默认底部模板
   */
  var DEFAULT_HEADER = '<div class="dlg-header"><span class="dlg-title">{{title}}</span><span class="dlg-close-btn" id="{{closeBtnId}}">&times</span></div>',
      DEFAULT_FOOTER = '<div class="dlg-footer"><button id="{{sureBtnId}}" class="dlg-sure dlg-btn">确&nbsp;&nbsp;定</button><button class="dlg-cancel dlg-btn" id="{{cancelBtnId}}">取&nbsp;&nbsp;消</button></div>';

  /**
   *
   */
  var VARIABLE_LABEL_REG = /\{\{([^{}]*)\}\}/g;

  /**
   * 默认的配置项
   * @param isModal 是否是模态框
   * @param alertTpl 默认的警告框模板
   * @param promptTpl 默认的请求输入框模板
   * @param confirmTpl 默认的确认框模板
   */
  var defaultOptions = {
    title:"系统提示框",
    isModal : true,
    width : 380,
    isAll: false,
    msg: "",
    alertTpl : '<div class="dlg-content">{{msg}}</div>',
    promptTpl : '<div class="dlg-content"><div class="dlg-prompt-tip">{{msg}}</div><div class="dlg-prompt-input-wrap"><input type="text" class="dlg-prompt-input"/></div></div>',
    confirmTpl : '<div class="dlg-content">{{msg}}</div>'
  };

  /**
   * tmpl 渲染模板
   * data  待渲染的数据
   */
  var renderTpl = function(tmpl, data){
    return tmpl.replace(VARIABLE_LABEL_REG, function(str, key){
      return data[key] || str;
    });
  };

  /**
   * 绑定事件处理
   */
  var bindEvents = function(cb){
    var that = this;
    var doc = mask.contentWindow.document;
    var sureBtn = doc.getElementById(this.options.sureBtnId);
    var cancelBtn = doc.getElementById(this.options.cancelBtnId);
    var closeBtn = doc.getElementById(this.options.closeBtnId);
    this.options.callbackFuncs = {
      "sureFunc" : function(){
         that.destroy();
         cb && cb(true);
      },
      "cancelFunc" : function(){
         that.destroy();
         cb && cb(false);
      },
      "closeFunc" : function(){
         that.destroy();
         cb && cb(false);
      }
    };
    utils.dom.addEvent(sureBtn, 'click', this.options.callbackFuncs.sureFunc);
    utils.dom.addEvent(cancelBtn, 'click', this.options.callbackFuncs.cancelFunc);
    utils.dom.addEvent(closeBtn, 'click', this.options.callbackFuncs.closeFunc);
  };

  var Dialog = function(options, cb){
    var tpl = "";
    options = utils.tools.extends(options, defaultOptions);

    //拼接模板
    if (options.isAll && options.tpl) {
      tpl = options.tpl;
    } else {
      tpl = DEFAULT_HEADER + (options.tpl || options[options.type]) + DEFAULT_FOOTER;
    }

    //分配按钮id
    options.sureBtnId = utils.tools.getBtnId();
    options.cancelBtnId = utils.tools.getBtnId();
    options.closeBtnId = utils.tools.getBtnId();

    //渲染模板
    container.innerHTML = renderTpl(tpl, options);

    //调整对话框样式
    container.style.width = options.width + 'px';

    this.options = options;

    //绑定事件处理
    bindEvents.call(this, cb);
  };

  //显示对话框
  Dialog.prototype.show = function(){
     mask.style.display = "block";
  };

  //销毁对话框
  Dialog.prototype.destroy = function(){
     //删除事件绑定
     var doc = mask.contentWindow.document;
     var sureBtn = doc.getElementById(this.options.sureBtnId);
     var cancelBtn = doc.getElementById(this.options.cancelBtnId);
     var closeBtn = doc.getElementById(this.options.closeBtnId);

     //隐藏iframe 删除容器
     mask.style.display = 'none';
     container.innerHTML = '';

     utils.dom.removeEvent(sureBtn, 'click', this.options.callbackFuncs.sureFunc);
     utils.dom.removeEvent(cancelBtn, 'click', this.options.callbackFuncs.cancelFunc);
     utils.dom.removeEvent(closeBtn, 'click', this.options.callbackFuncs.closeFunc);
  };

  /**
   * 警告框
   * @param options 配置json
   * @param cb 关闭后的回调函数
   * options: {title:string, msg:string, width: number, tpl:string, isAll: boolean }
   * title 是对话框标题
   * msg 是提示信息
   * tpl 对话框的模板
   * isAll是否替换整个模板包含（head和footer）
   */
  Dialog.alert = function(options, cb){
    options = options || {type:"alertTpl"};
    options.type = "alertTpl";
    var dlg = new Dialog(options, cb);
    dlg.show();
  };

  /**
   * 请求输入框
   * @param options 配置json
   * @param cb 关闭后的回调函数
   * options: {title:title, msg:msg, tpl:string, isAll: boolean}
   * title 是对话框标题
   * msg 是提示信息
   * tpl 对话框的模板
   * isAll是否替换整个模板包含（head和footer）
   */
  Dialog.prompt = function(options, cb){

  };

  /**
   * 操作确认框
   * @param options 配置json
   * @param cb 关闭后的回调函数
   * options: {title:title, msg:msg, tpl:string, isAll: boolean}
   * title 是对话框标题
   * msg 是提示信息
   * tpl 对话框的模板
   * isAll是否替换整个模板包含（head和footer）
   */
  Dialog.confirm = function(options, cb){

  };

  Dialog.open = function(options, cb){

  };

  Dialog.utils = utils;

  setTimeout(function(){
    //创建iframe并保存在mask中
    mask = utils.dom.createIframe('dialogMaskFrame');
    mask.className = 'dialogMaskFrame';
    document.body.appendChild(mask);

    //创建对话框的容器
    container = document.createElement('div');
    container.className = "dlg-container"
    mask.style.display = "none";

    //初始化mask的大小和屏幕一样高
    mask.style.height = utils.dom.getViewPortSize().height + 'px';
    mask.contentWindow.document.body.appendChild(container);

    //加载对话框里面的样式
    utils.dom.importStyle('dialog.css',mask.contentWindow.document);
  }, 0);

  return Dialog;
})();
