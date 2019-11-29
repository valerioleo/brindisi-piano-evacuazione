!function(e){function t(t){for(var n,a,o=t[0],i=t[1],s=t[2],u=0,l=[];u<o.length;u++)a=o[u],Object.prototype.hasOwnProperty.call(D,a)&&D[a]&&l.push(D[a][0]),D[a]=0;for(n in i)Object.prototype.hasOwnProperty.call(i,n)&&(e[n]=i[n]);for(T&&T(t);l.length;)l.shift()();return L.push.apply(L,s||[]),r()}function r(){for(var e,t=0;t<L.length;t++){for(var r=L[t],n=!0,a=1;a<r.length;a++){var o=r[a];0!==D[o]&&(n=!1)}n&&(L.splice(t--,1),e=M(M.s=r[0]))}return e}var n=window.webpackHotUpdate;window.webpackHotUpdate=function(e,t){!function(e,t){if(!j[e]||!O[e])return;for(var r in O[e]=!1,t)Object.prototype.hasOwnProperty.call(t,r)&&(h[r]=t[r]);0==--b&&0===y&&_()}(e,t),n&&n(e,t)};var a,o=!0,i="0090fc3b4a041eb6d1f9",s=1e4,u={},l=[],c=[];function d(e){var t={_acceptedDependencies:{},_declinedDependencies:{},_selfAccepted:!1,_selfDeclined:!1,_disposeHandlers:[],_main:a!==e,active:!0,accept:function(e,r){if(void 0===e)t._selfAccepted=!0;else if("function"==typeof e)t._selfAccepted=e;else if("object"==typeof e)for(var n=0;n<e.length;n++)t._acceptedDependencies[e[n]]=r||function(){};else t._acceptedDependencies[e]=r||function(){}},decline:function(e){if(void 0===e)t._selfDeclined=!0;else if("object"==typeof e)for(var r=0;r<e.length;r++)t._declinedDependencies[e[r]]=!0;else t._declinedDependencies[e]=!0},dispose:function(e){t._disposeHandlers.push(e)},addDisposeHandler:function(e){t._disposeHandlers.push(e)},removeDisposeHandler:function(e){var r=t._disposeHandlers.indexOf(e);r>=0&&t._disposeHandlers.splice(r,1)},check:I,apply:w,status:function(e){if(!e)return f;p.push(e)},addStatusHandler:function(e){p.push(e)},removeStatusHandler:function(e){var t=p.indexOf(e);t>=0&&p.splice(t,1)},data:u[e]};return a=void 0,t}var p=[],f="idle";function m(e){f=e;for(var t=0;t<p.length;t++)p[t].call(null,e)}var v,h,g,b=0,y=0,A={},O={},j={};function E(e){return+e+""===e?+e:e}function I(e){if("idle"!==f)throw new Error("check() is only allowed in idle status");return o=e,m("check"),(t=s,t=t||1e4,new Promise((function(e,r){if("undefined"==typeof XMLHttpRequest)return r(new Error("No browser support"));try{var n=new XMLHttpRequest,a=M.p+""+i+".hot-update.json";n.open("GET",a,!0),n.timeout=t,n.send(null)}catch(e){return r(e)}n.onreadystatechange=function(){if(4===n.readyState)if(0===n.status)r(new Error("Manifest request to "+a+" timed out."));else if(404===n.status)e();else if(200!==n.status&&304!==n.status)r(new Error("Manifest request to "+a+" failed."));else{try{var t=JSON.parse(n.responseText)}catch(e){return void r(e)}e(t)}}}))).then((function(e){if(!e)return m("idle"),null;O={},A={},j=e.c,g=e.h,m("prepare");var t=new Promise((function(e,t){v={resolve:e,reject:t}}));for(var r in h={},D)S(r);return"prepare"===f&&0===y&&0===b&&_(),t}));var t}function S(e){j[e]?(O[e]=!0,b++,function(e){var t=document.createElement("script");t.charset="utf-8",t.src=M.p+""+e+"."+i+".hot-update.js",document.head.appendChild(t)}(e)):A[e]=!0}function _(){m("ready");var e=v;if(v=null,e)if(o)Promise.resolve().then((function(){return w(o)})).then((function(t){e.resolve(t)}),(function(t){e.reject(t)}));else{var t=[];for(var r in h)Object.prototype.hasOwnProperty.call(h,r)&&t.push(E(r));e.resolve(t)}}function w(t){if("ready"!==f)throw new Error("apply() is only allowed in ready status");var r,n,a,o,s;function c(e){for(var t=[e],r={},n=t.map((function(e){return{chain:[e],id:e}}));n.length>0;){var a=n.pop(),i=a.id,s=a.chain;if((o=P[i])&&!o.hot._selfAccepted){if(o.hot._selfDeclined)return{type:"self-declined",chain:s,moduleId:i};if(o.hot._main)return{type:"unaccepted",chain:s,moduleId:i};for(var u=0;u<o.parents.length;u++){var l=o.parents[u],c=P[l];if(c){if(c.hot._declinedDependencies[i])return{type:"declined",chain:s.concat([l]),moduleId:i,parentId:l};-1===t.indexOf(l)&&(c.hot._acceptedDependencies[i]?(r[l]||(r[l]=[]),d(r[l],[i])):(delete r[l],t.push(l),n.push({chain:s.concat([l]),id:l})))}}}}return{type:"accepted",moduleId:e,outdatedModules:t,outdatedDependencies:r}}function d(e,t){for(var r=0;r<t.length;r++){var n=t[r];-1===e.indexOf(n)&&e.push(n)}}t=t||{};var p={},v=[],b={},y=function(){console.warn("[HMR] unexpected require("+O.moduleId+") to disposed module")};for(var A in h)if(Object.prototype.hasOwnProperty.call(h,A)){var O;s=E(A);var I=!1,S=!1,_=!1,w="";switch((O=h[A]?c(s):{type:"disposed",moduleId:A}).chain&&(w="\nUpdate propagation: "+O.chain.join(" -> ")),O.type){case"self-declined":t.onDeclined&&t.onDeclined(O),t.ignoreDeclined||(I=new Error("Aborted because of self decline: "+O.moduleId+w));break;case"declined":t.onDeclined&&t.onDeclined(O),t.ignoreDeclined||(I=new Error("Aborted because of declined dependency: "+O.moduleId+" in "+O.parentId+w));break;case"unaccepted":t.onUnaccepted&&t.onUnaccepted(O),t.ignoreUnaccepted||(I=new Error("Aborted because "+s+" is not accepted"+w));break;case"accepted":t.onAccepted&&t.onAccepted(O),S=!0;break;case"disposed":t.onDisposed&&t.onDisposed(O),_=!0;break;default:throw new Error("Unexception type "+O.type)}if(I)return m("abort"),Promise.reject(I);if(S)for(s in b[s]=h[s],d(v,O.outdatedModules),O.outdatedDependencies)Object.prototype.hasOwnProperty.call(O.outdatedDependencies,s)&&(p[s]||(p[s]=[]),d(p[s],O.outdatedDependencies[s]));_&&(d(v,[O.moduleId]),b[s]=y)}var L,x=[];for(n=0;n<v.length;n++)s=v[n],P[s]&&P[s].hot._selfAccepted&&b[s]!==y&&x.push({module:s,errorHandler:P[s].hot._selfAccepted});m("dispose"),Object.keys(j).forEach((function(e){!1===j[e]&&function(e){delete D[e]}(e)}));for(var C,R,T=v.slice();T.length>0;)if(s=T.pop(),o=P[s]){var N={},k=o.hot._disposeHandlers;for(a=0;a<k.length;a++)(r=k[a])(N);for(u[s]=N,o.hot.active=!1,delete P[s],delete p[s],a=0;a<o.children.length;a++){var U=P[o.children[a]];U&&((L=U.parents.indexOf(s))>=0&&U.parents.splice(L,1))}}for(s in p)if(Object.prototype.hasOwnProperty.call(p,s)&&(o=P[s]))for(R=p[s],a=0;a<R.length;a++)C=R[a],(L=o.children.indexOf(C))>=0&&o.children.splice(L,1);for(s in m("apply"),i=g,b)Object.prototype.hasOwnProperty.call(b,s)&&(e[s]=b[s]);var F=null;for(s in p)if(Object.prototype.hasOwnProperty.call(p,s)&&(o=P[s])){R=p[s];var z=[];for(n=0;n<R.length;n++)if(C=R[n],r=o.hot._acceptedDependencies[C]){if(-1!==z.indexOf(r))continue;z.push(r)}for(n=0;n<z.length;n++){r=z[n];try{r(R)}catch(e){t.onErrored&&t.onErrored({type:"accept-errored",moduleId:s,dependencyId:R[n],error:e}),t.ignoreErrored||F||(F=e)}}}for(n=0;n<x.length;n++){var q=x[n];s=q.module,l=[s];try{M(s)}catch(e){if("function"==typeof q.errorHandler)try{q.errorHandler(e)}catch(r){t.onErrored&&t.onErrored({type:"self-accept-error-handler-errored",moduleId:s,error:r,originalError:e}),t.ignoreErrored||F||(F=r),F||(F=e)}else t.onErrored&&t.onErrored({type:"self-accept-errored",moduleId:s,error:e}),t.ignoreErrored||F||(F=e)}}return F?(m("fail"),Promise.reject(F)):(m("idle"),new Promise((function(e){e(v)})))}var P={},D={0:0},L=[];function M(t){if(P[t])return P[t].exports;var r=P[t]={i:t,l:!1,exports:{},hot:d(t),parents:(c=l,l=[],c),children:[]};return e[t].call(r.exports,r,r.exports,function(e){var t=P[e];if(!t)return M;var r=function(r){return t.hot.active?(P[r]?-1===P[r].parents.indexOf(e)&&P[r].parents.push(e):(l=[e],a=r),-1===t.children.indexOf(r)&&t.children.push(r)):(console.warn("[HMR] unexpected require("+r+") from disposed module "+e),l=[]),M(r)},n=function(e){return{configurable:!0,enumerable:!0,get:function(){return M[e]},set:function(t){M[e]=t}}};for(var o in M)Object.prototype.hasOwnProperty.call(M,o)&&"e"!==o&&"t"!==o&&Object.defineProperty(r,o,n(o));return r.e=function(e){return"ready"===f&&m("prepare"),y++,M.e(e).then(t,(function(e){throw t(),e}));function t(){y--,"prepare"===f&&(A[e]||S(e),0===y&&0===b&&_())}},r.t=function(e,t){return 1&t&&(e=r(e)),M.t(e,-2&t)},r}(t)),r.l=!0,r.exports}M.m=e,M.c=P,M.d=function(e,t,r){M.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},M.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},M.t=function(e,t){if(1&t&&(e=M(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(M.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)M.d(r,n,function(t){return e[t]}.bind(null,n));return r},M.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return M.d(t,"a",t),t},M.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},M.p="/",M.h=function(){return i};var x=window.webpackJsonp=window.webpackJsonp||[],C=x.push.bind(x);x.push=t,x=x.slice();for(var R=0;R<x.length;R++)t(x[R]);var T=C;L.push([0,1]),r()}({"../../assets/icons/bomb.png":function(e,t,r){e.exports=r.p+"./images/bomb-fcbcc025805c960059768aee7f9e751d.png"},"../common/fn.js":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js"),a=n(r("../node_modules/@babel/runtime/helpers/typeof.js")),o=n(r("../node_modules/@babel/runtime/helpers/toConsumableArray.js")),i=n(r("../node_modules/@babel/runtime/helpers/objectWithoutProperties.js")),s=n(r("../node_modules/@babel/runtime/helpers/defineProperty.js"));function u(e){var t=function(e,t){if("object"!==(0,a.default)(e)||null===e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var n=r.call(e,t||"default");if("object"!==(0,a.default)(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(e,"string");return"symbol"===(0,a.default)(t)?t:String(t)}function l(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function c(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?l(Object(r),!0).forEach((function(t){(0,s.default)(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):l(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}var d=r("../node_modules/folktale/core/lambda/identity.js");Function.prototype["∘"]=function(e){var t=this;return function(r){return t(e(r))}};var p=function(e){return function(t){t[e];return(0,i.default)(t,[e].map(u))}};e.exports={identity:d,toJS:function(e){return e.toJS()},partial:function(e){for(var t=arguments.length,r=new Array(t>1?t-1:0),n=1;n<t;n++)r[n-1]=arguments[n];return function(){for(var t=arguments.length,n=new Array(t),a=0;a<t;a++)n[a]=arguments[a];return e.apply(void 0,r.concat(n))}},partialSpread:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return function(){var r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return e.call(void 0,c({},t,{},r))}},prop:function(e){return function(t){return t[e]}},immutableGet:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:d;return function(r){return t(r.get(e))}},immutableGetIn:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:d;return function(r){return t(r.getIn(e))}},maybeValueReturn:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:d;return function(t){var r=t.value;return e(r)}},maybeValueGet:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:d;return function(r){var n=r.value;return t(n.get(e))}},maybeValueGetIn:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:d;return function(r){var n=r.value;return t(n.getIn(e))}},asyncDataReturn:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:d;return function(t){var r=t.data;return e(r)}},asyncDataGet:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:d;return function(r){var n=r.data;return t(n.get(e))}},asyncDataGetIn:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:d;return function(r){var n=r.data;return t(n.getIn(e))}},noop:function(){},constant:function(e){return function(){return e}},flatten:function e(t){return t.reduce((function(t,r){return t.concat(Array.isArray(r)?e(r):r)}),[])},isFunction:function(e){return"function"==typeof e},not:function(e){return!e},head:function(e){return e[0]},last:function(e){return e[e.length-1]},removeNullProperties:function(e){return Object.keys(e).reduce((function(t,r){return null===e[r]?t:c({},t,(0,s.default)({},r,e[r]))}),{})},removeUndefinedProperties:function(e){return Object.keys(e).reduce((function(t,r){return void 0===e[r]||null===e[r]?t:c({},t,(0,s.default)({},r,e[r]))}),{})},ignoreProp:p,ignoreProps:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[];return function(t){return e.reduce((function(e,t){return p(t)(e)}),t)}},removeLastItem:function(e){var t=(0,o.default)(e);return t.pop(),t},ignoreAtIndex:function(e,t){return e.reduce((function(e,r,n){return n===t?e:[].concat((0,o.default)(e),[r])}),[])},throwWithMessage:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";return function(){throw Error(e)}},map:function(e){return function(t){return t.map(e)}}}},"../common/fn/monads/AsyncData.js":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js")(r("../node_modules/@babel/runtime/helpers/defineProperty.js")),a=r("../node_modules/folktale/adt/union/union.js"),o=r("../common/fn.js"),i=o.constant,s=o.prop,u=a("AsyncData",{Empty:function(){return!0},Loading:function(e){return{data:e}},Success:function(e){return{data:e}},Failure:function(e,t){return{error:e,data:t}}}),l=function(e){return e.every((function(e){return e.matchWith({Empty:function(){return!1},Loading:function(){return!1},Success:function(){return!0},Failure:function(){return!1}})}))},c=function(e){return e.some((function(e){return e.matchWith({Empty:function(){return!1},Loading:function(){return!1},Success:function(){return!0},Failure:function(){return!1}})}))},d=function(e){return l(e)?u.Success():u.Loading()};u.map=function(e){var t=this,r=function(){return t};return this.matchWith({Empty:r,Loading:r,Success:function(t){var r=t.data;return u.Success(e(r))},Failure:r})},u.chain=function(e){var t=this,r=function(){return t};return this.matchWith({Empty:r,Loading:r,Success:function(r){return r.data?t:e()},Failure:r})},u.after=function(e){var t=this;return d([this,e]).map((function(){return[t.mapPattern("Success",null,s("data")),e.mapPattern("Success",null,s("data"))]}))},u.mapPattern=function(e,t,r){return this.matchWith((0,n.default)({Empty:i(t),Loading:i(t),Success:i(t),Failure:i(t)},e,r))},e.exports={AsyncData:u,AsyncDataAll:d,allSuccess:l,someSuccess:c}},"./src/data/core/reducer.js":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js");Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var a=r("../node_modules/redux/es/redux.js"),o=r("../node_modules/redux-form/es/index.js"),i=n(r("./src/data/system/systemReducer.js")),s=(0,a.combineReducers)({form:o.reducer,system:i.default});t.default=s},"./src/data/core/store.js":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js");Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var a=r("../node_modules/redux/es/redux.js"),o=n(r("../node_modules/redux-thunk/es/index.js")),i=n(r("./src/data/middleware/taskMiddleware.js")),s=window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__||a.compose;t.default=function(e,t){return(0,a.createStore)(e,t,s((0,a.applyMiddleware)(i.default,o.default)))}},"./src/data/middleware/taskMiddleware.js":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js");Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var a=n(r("../node_modules/@babel/runtime/helpers/defineProperty.js")),o=n(r("../node_modules/@babel/runtime/helpers/objectWithoutProperties.js")),i=r("../node_modules/immutable/dist/immutable.es.js"),s=r("../common/fn/monads/AsyncData.js");function u(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function l(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?u(Object(r),!0).forEach((function(t){(0,a.default)(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):u(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}t.default=function(e){var t=e.dispatch;return function(e){return function(r){var n,a=r.payload||{},u=a.async,c=(0,o.default)(a,["async"]);return(n=u)&&"function"==typeof n.then?t(l({},r,{payload:s.AsyncData.Loading((0,i.fromJS)(c))}))&&u.then((function(e){return Array.isArray(e)?t(l({},r,{payload:s.AsyncData.Success((0,i.fromJS)(l({},c,{list:e})))})):t(l({},r,{payload:s.AsyncData.Success((0,i.fromJS)(l({},c,{},e)))}))})).catch((function(e){return t(l({},r,{payload:s.AsyncData.Failure(e,(0,i.fromJS)(c)),error:!0,errorMessage:e.message}))})):e(r)}}}},"./src/data/services/api.js":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js");Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var a=n(r("../node_modules/@babel/runtime/regenerator/index.js")),o=function(e){var t,r,n,o,i,s,u,l=arguments;return a.default.async((function(c){for(;;)switch(c.prev=c.next){case 0:return t=l.length>1&&void 0!==l[1]?l[1]:"GET",r=l.length>2&&void 0!==l[2]?l[2]:{},n=l.length>3?l[3]:void 0,o=l.length>4?l[4]:void 0,i={method:t,headers:n},o||(i.headers["content-type"]="application/json"),"GET"!==t&&"DELETE"!==t&&(i.body=o?r:JSON.stringify(r)),c.next=9,a.default.awrap(fetch(e,i));case 9:if(401!==(s=c.sent).status){c.next=12;break}throw new Error(s.status);case 12:if(!(s.status>=400)){c.next=17;break}return c.next=15,a.default.awrap(s.text());case 15:throw u=c.sent,new Error(u);case 17:if(204!==s.status){c.next=19;break}return c.abrupt("return",{result:r});case 19:return c.next=21,a.default.awrap(s.json());case 21:return c.abrupt("return",c.sent);case 22:case"end":return c.stop()}}))};t.default=o},"./src/data/system/systemActions.js":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js");Object.defineProperty(t,"__esModule",{value:!0}),t.loadLastMediumPosts=t.loadLastTweets=t.loadLastMediumPostsRoot=t.loadLastTweetsRoot=t.LOAD_LAST_MEDIUM_POSTS=t.LOAD_LAST_TWEETS=void 0;var a=r("../node_modules/redux-actions/es/index.js"),o=n(r("./src/data/services/api.js"));t.LOAD_LAST_TWEETS="SOCIAL:LOAD_LAST_TWEETS";t.LOAD_LAST_MEDIUM_POSTS="SOCIAL:LOAD_LAST_MEDIUM_POSTS";var i=function(e){return function(){var t=e("/tweets","GET");return(0,a.createAction)("SOCIAL:LOAD_LAST_TWEETS")({async:t})}};t.loadLastTweetsRoot=i;var s=function(e){return function(){var t=e("/medium-posts","GET");return(0,a.createAction)("SOCIAL:LOAD_LAST_MEDIUM_POSTS")({async:t})}};t.loadLastMediumPostsRoot=s;var u=i(o.default);t.loadLastTweets=u;var l=s(o.default);t.loadLastMediumPosts=l},"./src/data/system/systemReducer.js":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js");Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var a,o=n(r("../node_modules/@babel/runtime/helpers/defineProperty.js")),i=r("../node_modules/redux-actions/es/index.js"),s=r("../node_modules/immutable/dist/immutable.es.js"),u=r("../common/fn/monads/AsyncData.js"),l=r("./src/data/system/systemActions.js"),c=(0,s.Map)({loadLastTweetsResult:u.AsyncData.Empty(),loadLastMediumPostsResult:u.AsyncData.Empty()}),d=(0,i.handleActions)((a={},(0,o.default)(a,l.LOAD_LAST_TWEETS,(function(e,t){var r=t.payload;return e.set("loadLastTweetsResult",r.map((function(e){return e.get("list")})))})),(0,o.default)(a,l.LOAD_LAST_MEDIUM_POSTS,(function(e,t){var r=t.payload;return e.set("loadLastMediumPostsResult",r.map((function(e){return e.get("list")})))})),a),c);t.default=d},"./src/view/AppRoot.jsx":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js");Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var a=n(r("../node_modules/react/index.js")),o=r("../node_modules/react-redux/es/index.js"),i=r("../node_modules/react-dom/index.js");r("../common/fn.js");t.default=function(e,t){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"root",n=function(){return a.default.createElement(o.Provider,{store:e},a.default.createElement(t,null))};(0,i.render)(a.default.createElement(n,null),document.getElementById(r))}},"./src/view/WebsiteApp.jsx":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js"),a=n(r("./src/data/core/store.js")),o=n(r("./src/data/core/reducer.js")),i=n(r("./src/view/core/WebsiteRouter.jsx")),s=n(r("./src/view/AppRoot.jsx")),u=(0,a.default)(o.default);(0,s.default)(u,i.default,"root")},"./src/view/core/WebsiteRouter.jsx":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireWildcard.js"),a=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js");Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var o=a(r("../node_modules/@babel/runtime/helpers/classCallCheck.js")),i=a(r("../node_modules/@babel/runtime/helpers/createClass.js")),s=a(r("../node_modules/@babel/runtime/helpers/possibleConstructorReturn.js")),u=a(r("../node_modules/@babel/runtime/helpers/getPrototypeOf.js")),l=a(r("../node_modules/@babel/runtime/helpers/inherits.js")),c=n(r("../node_modules/react/index.js")),d=r("../node_modules/react-router-dom/esm/react-router-dom.js"),p=(r("../node_modules/react-hot-loader/root.js"),a(r("./src/view/pages/home-page/index.jsx"))),f=function(e){function t(){return(0,o.default)(this,t),(0,s.default)(this,(0,u.default)(t).apply(this,arguments))}return(0,l.default)(t,e),(0,i.default)(t,[{key:"shouldComponentUpdate",value:function(){return!1}},{key:"render",value:function(){return c.default.createElement(d.BrowserRouter,null,c.default.createElement(d.Switch,null,c.default.createElement(d.Route,{exact:!0,path:"/",component:p.default})))}}]),t}(c.Component);t.default=f},"./src/view/pages/home-page/Autocomplete.jsx":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireWildcard.js"),a=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js");Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var o=a(r("../node_modules/@babel/runtime/helpers/slicedToArray.js")),i=n(r("../node_modules/react/index.js")),s=r("../node_modules/@react-google-maps/api/dist/reactgooglemapsapi.esm.js"),u=function(e){var t=e.onPlaceChanged,r=(0,i.useState)(null),n=(0,o.default)(r,2),a=n[0],u=n[1];return i.default.createElement(s.Autocomplete,{onLoad:function(e){u(e)},onPlaceChanged:function(){null!==a&&t(a.getPlace().geometry.location)},options:{strictBounds:!0},restrictions:{country:"it"},types:["address"]},i.default.createElement("input",{type:"text",placeholder:"📍Inserisci indirizzo da cercare",style:{boxSizing:"border-box",border:"1px solid transparent",width:"240px",height:"32px",padding:"0 12px",boxShadow:"0 2px 6px rgba(0, 0, 0, 0.3)",fontSize:"14px",outline:"none",textOverflow:"ellipses",marginTop:"20px",marginBottom:"20px"}}))};t.default=u},"./src/view/pages/home-page/Footer.jsx":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js");Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var a=n(r("../node_modules/react/index.js")),o=n(r("../node_modules/@material-ui/core/esm/Typography/index.js")),i=function(){return a.default.createElement(a.default.Fragment,null,a.default.createElement(o.default,{gutterBottom:!0,variant:"body2"},"I costi del servizio Google Maps sono attualmente coperti dallo sviluppatore. Se i costi dovessero diventare proibitivi, il sito entrerà in blocco automatico. Per fare in modo che tutti usufruiscano del servizio, effettua solo le ricerche strettamente necessarie 🙏🏻"),a.default.createElement(o.default,{variant:"caption"},"Per ogni correzione, invito cittadini e autorità a contattarmi a ",a.default.createElement("a",{href:"mailto:brindisi@valerioleo.me"},"brindisi@valerioleo.me"),".",a.default.createElement("br",null),a.default.createElement("br",null),"Questo sito web è offerto a puro scopo indicativo e non si sostituisce in alcun modo alle comunicazioni ufficiali che rimangono la sola e unica fonte da tenere in considerazione per prendere decisioni corrette. ",a.default.createElement("a",{href:"https://github.com/valerioleo/brindisi-piano-evacuazione"},"Il sito è distributio in open-source"),"."))};t.default=i},"./src/view/pages/home-page/POI.jsx":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js");Object.defineProperty(t,"__esModule",{value:!0}),t.AreeAttesa=t.Rifugi=void 0;var a=n(r("../node_modules/react/index.js")),o=r("../node_modules/@react-google-maps/api/dist/reactgooglemapsapi.esm.js"),i=r("./src/view/pages/home-page/markers.js");t.Rifugi=function(){return i.rifugi.map((function(e){return a.default.createElement(o.Marker,{key:e.name,position:e.coordinates,title:e.name,icon:"https://maps.google.com/mapfiles/kml/shapes/homegardenbusiness.png"})}))};t.AreeAttesa=function(){return i.areeAttesa.map((function(e){return a.default.createElement(o.Marker,{key:e.name,position:e.coordinates,title:e.name})}))}},"./src/view/pages/home-page/Response.jsx":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js");Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var a=n(r("../node_modules/react/index.js")),o=n(r("../node_modules/@material-ui/core/esm/Typography/index.js")),i=function(e){var t,r=e.distance,n=e.closestShelters,i=void 0===n?[]:n;return a.default.createElement(a.default.Fragment,null,a.default.createElement(o.default,{variant:"h3"},"Evacuazione Brindisi"),a.default.createElement(o.default,{gutterBottom:!0,variant:"subtitle1"},"15 dicembre 2019."),a.default.createElement(o.default,{gutterBottom:!0,variant:"h5"},r?function(e){var t;switch(!0){case e<300:t=a.default.createElement(o.default,{variant:"subtitle1"},"💩 Sei distante solo ",a.default.createElement("strong",null,e),"metri dalla bomba. Segui le procedure di sicurezza.");break;case e<500:t=a.default.createElement(o.default,{variant:"subtitle1"},"☠️ Sei distante solo ",a.default.createElement("strong",null,e),"metri dalla bomba. Segui le procedure di sicurezza.");break;case e<1617:t=a.default.createElement(o.default,{variant:"subtitle1"},"🏃‍ Sei distante ",a.default.createElement("strong",null,e)," metri dalla bomba.",a.default.createElement("br",null),"Segui le procedure di sicurezza per l'evacuazione.");break;default:t=a.default.createElement(o.default,{variant:"subtitle1"},"‍🍾 Sei distante ",a.default.createElement("strong",null,e)," metri dalla bomba. Stai scuscitato.")}return a.default.createElement(a.default.Fragment,null,e>1617?a.default.createElement("div",{style:{maxWidth:"300px",border:"1px solid green",background:"#d1e7b9",padding:"10px",borderRadius:"5px"}},a.default.createElement(o.default,{variant:"h5"},"✅ il tuo indirizzo risulta al di fuori dell'area interessata.")):a.default.createElement("div",{style:{maxWidth:"300px",border:"1px solid red",background:"#fce6e5",padding:"10px",borderRadius:"5px"}},a.default.createElement(o.default,{variant:"h5"},"❌ il tuo indirizzo risulta all'interno dell'area interessata.")),t)}(Math.floor(r)):"🔍 Cerca il tuo indirizzo per verificare se rientri nel piano di evacuazione."),i.length>0&&(t=i.slice(0,5),a.default.createElement(a.default.Fragment,null,a.default.createElement(o.default,{variant:"h5"},"Se non hai un posto sicuro dove evacuare, questi sono i 5 rifugi più vicini a te in linea d'aria:"),t.map((function(e,t){return a.default.createElement("div",{key:t},a.default.createElement(o.default,null,t+1,". ",e.name," - distante ",a.default.createElement("strong",null,e.distance)," metri."))})))))};t.default=i},"./src/view/pages/home-page/index.jsx":function(e,t,r){"use strict";var n=r("../node_modules/@babel/runtime/helpers/interopRequireWildcard.js"),a=r("../node_modules/@babel/runtime/helpers/interopRequireDefault.js");Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var o=a(r("../node_modules/@babel/runtime/helpers/defineProperty.js")),i=a(r("../node_modules/@babel/runtime/helpers/slicedToArray.js")),s=n(r("../node_modules/react/index.js")),u=r("../node_modules/@react-google-maps/api/dist/reactgooglemapsapi.esm.js"),l=a(r("../node_modules/@material-ui/core/esm/Typography/index.js")),c=a(r("./src/view/pages/home-page/Autocomplete.jsx")),d=a(r("./src/view/pages/home-page/Response.jsx")),p=a(r("./src/view/pages/home-page/Footer.jsx")),f=r("./src/view/pages/home-page/POI.jsx"),m=a(r("../../assets/icons/bomb.png")),v=r("./src/view/pages/home-page/markers.js");function h(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}var g=["places"],b=function(){var e=(0,s.useState)(null),t=(0,i.default)(e,2),r=t[0],n=t[1],a=(0,s.useState)({lat:40.628618,lng:17.941565}),b=(0,i.default)(a,1)[0],y=(0,s.useState)(null),A=(0,i.default)(y,2),O=A[0],j=A[1],E=(0,s.useState)(null),I=(0,i.default)(E,2),S=I[0],_=I[1],w=(0,s.useState)([]),P=(0,i.default)(w,2),D=P[0],L=P[1],M=function(e,t){return t.map((function(t){var r=window.google.maps.geometry.spherical.computeDistanceBetween(new window.google.maps.LatLng(e),new window.google.maps.LatLng(t.coordinates));return function(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?h(Object(r),!0).forEach((function(t){(0,o.default)(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):h(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}({},t,{distance:Math.floor(r)})})).sort((function(e,t){return e.distance-t.distance}))};return s.default.createElement(u.LoadScript,{googleMapsApiKey:"AIzaSyBvGm7crab9a19iT0cYs1PsovrKZ8GYcYU",libraries:g,language:"it",region:"IT"},s.default.createElement(d.default,{distance:S,closestShelters:D}),s.default.createElement(c.default,{onPlaceChanged:function(e){var t={lat:e.lat(),lng:e.lng()};j(t);var n=window.google.maps.geometry.spherical.computeDistanceBetween(e,r.getCenter());_(n),n<1617&&L(M(t,v.rifugi))}}),s.default.createElement(l.default,null,s.default.createElement("img",{style:{height:"26px",marginRight:"10px"},src:"http://maps.google.com/mapfiles/kml/shapes/homegardenbusiness.png"}),"Aree di accoglienza"),s.default.createElement(u.GoogleMap,{id:"searchbox-example",center:b,zoom:14,mapContainerStyle:{height:"500px"},options:{mapTypeControl:!1,streetViewControl:!1,rotateControl:!1,fullscreenControl:!1}},s.default.createElement(f.Rifugi,null),s.default.createElement(u.Marker,{position:O}),s.default.createElement(u.Marker,{position:b,icon:m.default}),s.default.createElement(u.Circle,{onLoad:n,center:b,radius:1617,options:{geodesic:!0,strokeColor:"#FFd000",strokeOpacity:1,strokeWeight:4,fillColor:"#FFd000",fillOpacity:.35}})),s.default.createElement(p.default,null))};t.default=b},"./src/view/pages/home-page/markers.js":function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.areeAttesa=t.rifugi=void 0;t.rifugi=[{name:"IC S.ELIA-COMMENDA SCUOLA MEDIA S.ELIA",address:"via Mantegna 23",coordinates:{lat:40.619333,lng:17.916395},capacity:"400 persone"},{name:"IC S.ELIA - COMMENDA - SCUOLA PRIMARIA VIA MANTEGNA",address:"via Mantegna 8",coordinates:{lat:40.619337,lng:17.921324},capacity:"560 persone"},{name:"IISS MAIORANA",address:"via Montebello 11",coordinates:{lat:40.625541,lng:17.92266},capacity:"800 persone"},{name:"IP ALB.PERTINI",address:"via Appia 356",coordinates:{lat:40.627969,lng:17.921589},capacity:"1200 persone"},{name:"IC CAPPUCCINI SCUOLA MEDIA L.DA VINCI",address:"via Don Luigi Guanella 9",coordinates:{lat:40.630758,lng:17.92231},capacity:"760 persone"},{name:"IC CASALE -PARADISO SCUOLA MEDIA MAMELI",address:"via della Torretta 40",coordinates:{lat:40.650651,lng:17.918321},capacity:"600 persone"},{name:"LICEO SCIENTIFICO FERMI MONTICELLI",address:"via Nicola Brandi 14-22",coordinates:{lat:40.644923,lng:17.927039},capacity:"1960 persone"},{name:"IISS CARNARO- MARCONI- FLACCO- BELLUZZI",address:"via Nicola Brandi 11",coordinates:{lat:40.644308,lng:17.928936},capacity:"1200 persone"},{name:"IISS FERRARIS- DE MARCO",address:"via Nicola Brandi 1",coordinates:{lat:40.643787,lng:17.931679},capacity:"680 persone"},{name:"ITT GIORGI",address:"via Amalfi 6,",coordinates:{lat:40.644559,lng:17.935267},capacity:"1520 persone"},{name:"IC CASALE- PARADISO SCUOLA MEDIA KENNEDY",address:"via Vincenzo Gigante 2",coordinates:{lat:40.645318,lng:17.939388},capacity:"700 persone"},{name:"IC CASALE PARADISO SCUOLA INFANZIA BOSCHETTI- ALBERTI + PRIMARIA CALO",address:"via Umberto Maddalena 31,",coordinates:{lat:40.648483,lng:17.944032},capacity:"240 persone"},{name:"IC CASALE- PARADISO SCUOLA PRIMARIA MARINAIO D'ITALIA 14",address:"via Primo Longobardo 6- 8",coordinates:{lat:40.64527,lng:17.940037},capacity:"450 persone"},{name:"IC CASALE PARADISO SCUOLA INFANZIA S.ANTONIO DA PADOVA",address:"via Ruggero Flores 37,",coordinates:{lat:40.64662,lng:17.944903},capacity:"120 persone"}];t.areeAttesa=[{name:"IC S.ELIA-COMMENDA SCUOLA MEDIA S.ELIA",address:"via Mantegna 23",coordinates:{lat:40.619333,lng:17.916395},capacity:"400 persone"},{name:"IC S.ELIA - COMMENDA - SCUOLA PRIMARIA VIA MANTEGNA",address:"via Mantegna 8",coordinates:{lat:40.619337,lng:17.921324},capacity:"560 persone"},{name:"IISS MAIORANA",address:"via Montebello 11",coordinates:{lat:40.625541,lng:17.92266},capacity:"800 persone"},{name:"IP ALB.PERTINI",address:"via Appia 356",coordinates:{lat:40.627969,lng:17.921589},capacity:"1200 persone"},{name:"IC CAPPUCCINI SCUOLA MEDIA L.DA VINCI",address:"via Don Luigi Guanella 9",coordinates:{lat:40.630758,lng:17.92231},capacity:"760 persone"},{name:"IC CASALE -PARADISO SCUOLA MEDIA MAMELI",address:"via della Torretta 40",coordinates:{lat:40.650651,lng:17.918321},capacity:"600 persone"},{name:"LICEO SCIENTIFICO FERMI MONTICELLI",address:"via Nicola Brandi 14-22",coordinates:{lat:40.644923,lng:17.927039},capacity:"1960 persone"},{name:"IISS CARNARO- MARCONI- FLACCO- BELLUZZI",address:"via Nicola Brandi 11",coordinates:{lat:40.644308,lng:17.928936},capacity:"1200 persone"},{name:"IISS FERRARIS- DE MARCO",address:"via Nicola Brandi 1",coordinates:{lat:40.643787,lng:17.931679},capacity:"680 persone"},{name:"ITT GIORGI",address:"via Amalfi 6,",coordinates:{lat:40.644559,lng:17.935267},capacity:"1520 persone"},{name:"IC CASALE- PARADISO SCUOLA MEDIA KENNEDY",address:"via Vincenzo Gigante 2",coordinates:{lat:40.645318,lng:17.939388},capacity:"700 persone"},{name:"IC CASALE PARADISO SCUOLA INFANZIA BOSCHETTI- ALBERTI + PRIMARIA CALO",address:"via Umberto Maddalena 31,",coordinates:{lat:40.648483,lng:17.944032},capacity:"240 persone"},{name:"IC CASALE- PARADISO SCUOLA PRIMARIA MARINAIO D'ITALIA 14",address:"via Primo Longobardo 6- 8",coordinates:{lat:40.64527,lng:17.940037},capacity:"450 persone"},{name:"IC CASALE PARADISO SCUOLA INFANZIA S.ANTONIO DA PADOVA",address:"via Ruggero Flores 37,",coordinates:{lat:40.64662,lng:17.944903},capacity:"120 persone"}]},0:function(e,t,r){e.exports=r("./src/view/WebsiteApp.jsx")}});