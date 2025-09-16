"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_document";
exports.ids = ["pages/_document"];
exports.modules = {

/***/ "(pages-dir-node)/./src/pages/_document.js":
/*!********************************!*\
  !*** ./src/pages/_document.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ Document)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_document__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/document */ \"(pages-dir-node)/./node_modules/next/document.js\");\n/* harmony import */ var next_document__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_document__WEBPACK_IMPORTED_MODULE_1__);\n\n\nfunction Document() {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.Html, {\n        lang: \"ko\",\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.Head, {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"meta\", {\n                        name: \"viewport\",\n                        content: \"width=device-width, initial-scale=1\"\n                    }, void 0, false, {\n                        fileName: \"/Users/won/Documents/GitHub/optimal-route-planner/src/pages/_document.js\",\n                        lineNumber: 7,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"meta\", {\n                        name: \"theme-color\",\n                        content: \"#2563eb\"\n                    }, void 0, false, {\n                        fileName: \"/Users/won/Documents/GitHub/optimal-route-planner/src/pages/_document.js\",\n                        lineNumber: 8,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"meta\", {\n                        name: \"description\",\n                        content: \"여러 장소를 효율적으로 방문할 수 있는 최적 경로를 자동으로 계산해주는 웹 애플리케이션\"\n                    }, void 0, false, {\n                        fileName: \"/Users/won/Documents/GitHub/optimal-route-planner/src/pages/_document.js\",\n                        lineNumber: 9,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"link\", {\n                        rel: \"icon\",\n                        href: \"/favicon.ico\"\n                    }, void 0, false, {\n                        fileName: \"/Users/won/Documents/GitHub/optimal-route-planner/src/pages/_document.js\",\n                        lineNumber: 13,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"link\", {\n                        rel: \"apple-touch-icon\",\n                        href: \"/logo192.png\"\n                    }, void 0, false, {\n                        fileName: \"/Users/won/Documents/GitHub/optimal-route-planner/src/pages/_document.js\",\n                        lineNumber: 14,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"link\", {\n                        rel: \"manifest\",\n                        href: \"/manifest.json\"\n                    }, void 0, false, {\n                        fileName: \"/Users/won/Documents/GitHub/optimal-route-planner/src/pages/_document.js\",\n                        lineNumber: 15,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"script\", {\n                        dangerouslySetInnerHTML: {\n                            __html: `\n              (function() {\n                const script = document.createElement('script');\n                script.src = 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=3hku2yfd31';\n                script.onload = function() {\n                  console.log('네이버 지도 SDK 로드 완료');\n                };\n                script.onerror = function() {\n                  console.error('네이버 지도 SDK 로드 실패');\n                };\n                document.head.appendChild(script);\n              })();\n            `\n                        }\n                    }, void 0, false, {\n                        fileName: \"/Users/won/Documents/GitHub/optimal-route-planner/src/pages/_document.js\",\n                        lineNumber: 18,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"script\", {\n                        dangerouslySetInnerHTML: {\n                            __html: `\n              (function() {\n                window.kakaoSdkReady = false;\n\n                window.initKakaoSdk = function() {\n                  if (window.kakao && window.kakao.maps) {\n                    try {\n                      window.kakao.maps.load(() => {\n                        window.kakaoSdkReady = true;\n                      });\n                    } catch (error) {}\n                  }\n                };\n\n                const script = document.createElement('script');\n                script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=5be0a34292474922b240a1bd76ad518c&libraries=services&autoload=false';\n                script.async = true;\n\n                script.onload = function() {\n                  setTimeout(window.initKakaoSdk, 100);\n                };\n\n                script.onerror = function() {\n                  console.error('카카오 지도 SDK 로드 실패');\n                };\n\n                document.head.appendChild(script);\n              })();\n            `\n                        }\n                    }, void 0, false, {\n                        fileName: \"/Users/won/Documents/GitHub/optimal-route-planner/src/pages/_document.js\",\n                        lineNumber: 37,\n                        columnNumber: 9\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/won/Documents/GitHub/optimal-route-planner/src/pages/_document.js\",\n                lineNumber: 6,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"body\", {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.Main, {}, void 0, false, {\n                        fileName: \"/Users/won/Documents/GitHub/optimal-route-planner/src/pages/_document.js\",\n                        lineNumber: 72,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.NextScript, {}, void 0, false, {\n                        fileName: \"/Users/won/Documents/GitHub/optimal-route-planner/src/pages/_document.js\",\n                        lineNumber: 73,\n                        columnNumber: 9\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/won/Documents/GitHub/optimal-route-planner/src/pages/_document.js\",\n                lineNumber: 71,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"/Users/won/Documents/GitHub/optimal-route-planner/src/pages/_document.js\",\n        lineNumber: 5,\n        columnNumber: 5\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3NyYy9wYWdlcy9fZG9jdW1lbnQuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQTZEO0FBRTlDLFNBQVNJO0lBQ3RCLHFCQUNFLDhEQUFDSiwrQ0FBSUE7UUFBQ0ssTUFBSzs7MEJBQ1QsOERBQUNKLCtDQUFJQTs7a0NBQ0gsOERBQUNLO3dCQUFLQyxNQUFLO3dCQUFXQyxTQUFROzs7Ozs7a0NBQzlCLDhEQUFDRjt3QkFBS0MsTUFBSzt3QkFBY0MsU0FBUTs7Ozs7O2tDQUNqQyw4REFBQ0Y7d0JBQ0NDLE1BQUs7d0JBQ0xDLFNBQVE7Ozs7OztrQ0FFViw4REFBQ0M7d0JBQUtDLEtBQUk7d0JBQU9DLE1BQUs7Ozs7OztrQ0FDdEIsOERBQUNGO3dCQUFLQyxLQUFJO3dCQUFtQkMsTUFBSzs7Ozs7O2tDQUNsQyw4REFBQ0Y7d0JBQUtDLEtBQUk7d0JBQVdDLE1BQUs7Ozs7OztrQ0FHMUIsOERBQUNDO3dCQUNDQyx5QkFBeUI7NEJBQ3ZCQyxRQUFRLENBQUM7Ozs7Ozs7Ozs7OztZQVlULENBQUM7d0JBQ0g7Ozs7OztrQ0FJRiw4REFBQ0Y7d0JBQ0NDLHlCQUF5Qjs0QkFDdkJDLFFBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztZQTRCVCxDQUFDO3dCQUNIOzs7Ozs7Ozs7Ozs7MEJBR0osOERBQUNDOztrQ0FDQyw4REFBQ2IsK0NBQUlBOzs7OztrQ0FDTCw4REFBQ0MscURBQVVBOzs7Ozs7Ozs7Ozs7Ozs7OztBQUluQiIsInNvdXJjZXMiOlsiL1VzZXJzL3dvbi9Eb2N1bWVudHMvR2l0SHViL29wdGltYWwtcm91dGUtcGxhbm5lci9zcmMvcGFnZXMvX2RvY3VtZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEh0bWwsIEhlYWQsIE1haW4sIE5leHRTY3JpcHQgfSBmcm9tICduZXh0L2RvY3VtZW50JztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gRG9jdW1lbnQoKSB7XG4gIHJldHVybiAoXG4gICAgPEh0bWwgbGFuZz1cImtvXCI+XG4gICAgICA8SGVhZD5cbiAgICAgICAgPG1ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xXCIgLz5cbiAgICAgICAgPG1ldGEgbmFtZT1cInRoZW1lLWNvbG9yXCIgY29udGVudD1cIiMyNTYzZWJcIiAvPlxuICAgICAgICA8bWV0YVxuICAgICAgICAgIG5hbWU9XCJkZXNjcmlwdGlvblwiXG4gICAgICAgICAgY29udGVudD1cIuyXrOufrCDsnqXshozrpbwg7Zqo7Jyo7KCB7Jy866GcIOuwqeusuO2VoCDsiJgg7J6I64qUIOy1nOyggSDqsr3roZzrpbwg7J6Q64+Z7Jy866GcIOqzhOyCsO2VtOyjvOuKlCDsm7kg7JWg7ZSM66as7LyA7J207IWYXCJcbiAgICAgICAgLz5cbiAgICAgICAgPGxpbmsgcmVsPVwiaWNvblwiIGhyZWY9XCIvZmF2aWNvbi5pY29cIiAvPlxuICAgICAgICA8bGluayByZWw9XCJhcHBsZS10b3VjaC1pY29uXCIgaHJlZj1cIi9sb2dvMTkyLnBuZ1wiIC8+XG4gICAgICAgIDxsaW5rIHJlbD1cIm1hbmlmZXN0XCIgaHJlZj1cIi9tYW5pZmVzdC5qc29uXCIgLz5cblxuICAgICAgICB7LyogTmF2ZXIgTWFwcyBBUEkgU2NyaXB0ICovfVxuICAgICAgICA8c2NyaXB0XG4gICAgICAgICAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3tcbiAgICAgICAgICAgIF9faHRtbDogYFxuICAgICAgICAgICAgICAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgICAgICAgICAgc2NyaXB0LnNyYyA9ICdodHRwczovL29hcGkubWFwLm5hdmVyLmNvbS9vcGVuYXBpL3YzL21hcHMuanM/bmNwS2V5SWQ9M2hrdTJ5ZmQzMSc7XG4gICAgICAgICAgICAgICAgc2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+uEpOydtOuyhCDsp4Drj4QgU0RLIOuhnOuTnCDsmYTro4wnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHNjcmlwdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCfrhKTsnbTrsoQg7KeA64+EIFNESyDroZzrk5wg7Iuk7YyoJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgICBgLFxuICAgICAgICAgIH19XG4gICAgICAgIC8+XG5cbiAgICAgICAgey8qIEtha2FvIE1hcHMgSmF2YVNjcmlwdCBTREsgdjIgKFBsYWNlcyDshJzruYTsiqQg7Y+s7ZWoKSAqL31cbiAgICAgICAgPHNjcmlwdFxuICAgICAgICAgIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7XG4gICAgICAgICAgICBfX2h0bWw6IGBcbiAgICAgICAgICAgICAgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5rYWthb1Nka1JlYWR5ID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICB3aW5kb3cuaW5pdEtha2FvU2RrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICBpZiAod2luZG93Lmtha2FvICYmIHdpbmRvdy5rYWthby5tYXBzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgd2luZG93Lmtha2FvLm1hcHMubG9hZCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cua2FrYW9TZGtSZWFkeSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7fVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgICAgICAgICBzY3JpcHQuc3JjID0gJ2h0dHBzOi8vZGFwaS5rYWthby5jb20vdjIvbWFwcy9zZGsuanM/YXBwa2V5PTViZTBhMzQyOTI0NzQ5MjJiMjQwYTFiZDc2YWQ1MThjJmxpYnJhcmllcz1zZXJ2aWNlcyZhdXRvbG9hZD1mYWxzZSc7XG4gICAgICAgICAgICAgICAgc2NyaXB0LmFzeW5jID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIHNjcmlwdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQod2luZG93LmluaXRLYWthb1NkaywgMTAwKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgc2NyaXB0Lm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+y5tOy5tOyYpCDsp4Drj4QgU0RLIOuhnOuTnCDsi6TtjKgnKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICAgICAgICB9KSgpO1xuICAgICAgICAgICAgYCxcbiAgICAgICAgICB9fVxuICAgICAgICAvPlxuICAgICAgPC9IZWFkPlxuICAgICAgPGJvZHk+XG4gICAgICAgIDxNYWluIC8+XG4gICAgICAgIDxOZXh0U2NyaXB0IC8+XG4gICAgICA8L2JvZHk+XG4gICAgPC9IdG1sPlxuICApO1xufVxuIl0sIm5hbWVzIjpbIkh0bWwiLCJIZWFkIiwiTWFpbiIsIk5leHRTY3JpcHQiLCJEb2N1bWVudCIsImxhbmciLCJtZXRhIiwibmFtZSIsImNvbnRlbnQiLCJsaW5rIiwicmVsIiwiaHJlZiIsInNjcmlwdCIsImRhbmdlcm91c2x5U2V0SW5uZXJIVE1MIiwiX19odG1sIiwiYm9keSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(pages-dir-node)/./src/pages/_document.js\n");

/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react/jsx-runtime":
/*!************************************!*\
  !*** external "react/jsx-runtime" ***!
  \************************************/
/***/ ((module) => {

module.exports = require("react/jsx-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc"], () => (__webpack_exec__("(pages-dir-node)/./src/pages/_document.js")));
module.exports = __webpack_exports__;

})();