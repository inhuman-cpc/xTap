;~function(W,D){
    var LONG_TAP_TIMEOUT = 500 //长按的最小间隔
    var DOUBLE_TAP_TIMEOUT = 200 //双击的最大间隔
    var entry_func = function(node, opts, useCapture){
        node = typeof node == 'string'? D.querySelector(node):node
        if(!node || !node.tagName)return
        node.touchyInfo = {
            tap : opts.single,
            dbtap : opts.double,
            longtap : opts.long,
            isMoving : false,
            isDbTap : false,
            lastTapTime : null,
            longTapStart : null,
            tapTimer : null,
            //未绑定双击事件时即时响应单击时间，否则延迟双击最大间隔响应
            tapTimeout : this.tap && !this.dbtap?0:DOUBLE_TAP_TIMEOUT,
            dbTapTimer : null
        }
        node.addEventListener('touchstart',function(e){
            with(this.touchyInfo){
                clearTimeout(tapTimer)
                clearTimeout(dbTapTimer)
                var now = Date.now()
                longTapStart = now
                isMoving = false
                //未绑定双击时进行双击操作会响应两次单击事件，因dbTapPeriod=0，isDbTap为false
                isDbTap = (lastTapTime &&(now-lastTapTime < DOUBLE_TAP_TIMEOUT))|| false
                lastTapTime = now
            }
        },useCapture)
        node.addEventListener('touchmove',function(e){
            with(this.touchyInfo){
                isMoving = true
                isDbTap = false
            }
        },useCapture)
        node.addEventListener('touchend',function(e){
            var that = this
            with(that.touchyInfo){
                //只要检测到滑动则取消所有的事件执行
                if(isMoving)return
                isMoving = false
                if(isDbTap){
                    needStopPropagation(dbtap, e)
                    //多次连续快速单击或双击只响应一次双击事件
                    if(dbtap){
                        dbTapTimer = setTimeout(function(){ dbtap.call(that,e)},DOUBLE_TAP_TIMEOUT)
                    }else{
                        //在只绑定了tap的元素上快速点击只响应一次tap事件
                        tapTimer = setTimeout(function(){ tap.call(that,e)},DOUBLE_TAP_TIMEOUT)
                    }
                    isDbTap = false
                }else{
                    var now = Date.now()
                    //长按离开时立即响应事件
                    if(now - longTapStart > LONG_TAP_TIMEOUT){
                        needStopPropagation(dbtap, e)
                        longtap && longtap.call(this,e)
                    }else{
                        //timer延时为双击最大间隔，防止双击时触发单击事件
                        var that = this
                        needStopPropagation(tap, e)
                        tap && (tapTimer = setTimeout(function(){
                            tap.call(that,e)
                        }, tapTimeout))
                    }
                }
            }
        },useCapture)
    }
    var needStopPropagation = function(func,e){
        var reg = /return(\s+)false/g, str = func.toString(), result
        while ((result = reg.exec(str)) != null)  {
            var matched = str.slice(result.index).match(/\}/g)
            if(matched && matched.length ==1){
                e.stopPropagation()
            }
        }
    }
    //辅助函数
    var apis = ['single', 'double', 'long']
    apis.forEach(function(api){
        entry_func[api] = function(node, func, useCapture){
            var param = {}
            param[api] = func
            this(node, param, useCapture)
        }
    })
    W.xTap = entry_func
}(window, document)