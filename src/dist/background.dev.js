"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _readOnlyError(name) { throw new Error("\"" + name + "\" is read-only"); }

// Param values from https://developer.mozilla.org/Add-ons/WebExtensions/API/contextualIdentities/create
var ALIBABA_CONTAINER_DETAILS = {
  name: "Alibaba",
  color: "orange",
  icon: "briefcase"
};
var ALIBABA_DOMAINS = ["alibabacloud.com", "alibaba.com", "alibaba.us", ""];
var ALIEXPRESS_DOMAINS = [];
var ALIBABA_SERVICES_DOMAINS = [];
ALIBABA_DOMAINS = (_readOnlyError("ALIBABA_DOMAINS"), ALIBABA_DOMAINS.concat(ALIBABA_DOMAINS, ALIEXPRESS_DOMAINS, ALIBABA_SERVICES_DOMAINS));
var MAC_ADDON_ID = "@testpilot-containers";
var macAddonEnabled = false;
var alibabaCookieStoreId = null;
var canceledRequests = {};
var tabsWaitingToLoad = {};
var tabStates = {};
var alibabaHostREs = [];

function isMACAddonEnabled() {
  var macAddonInfo;
  return regeneratorRuntime.async(function isMACAddonEnabled$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(browser.management.get(MAC_ADDON_ID));

        case 3:
          macAddonInfo = _context.sent;

          if (!macAddonInfo.enabled) {
            _context.next = 7;
            break;
          }

          sendJailedDomainsToMAC();
          return _context.abrupt("return", true);

        case 7:
          _context.next = 12;
          break;

        case 9:
          _context.prev = 9;
          _context.t0 = _context["catch"](0);
          return _context.abrupt("return", false);

        case 12:
          return _context.abrupt("return", false);

        case 13:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 9]]);
}

function setupMACAddonListeners() {
  var disabledExtension, enabledExtension;
  return regeneratorRuntime.async(function setupMACAddonListeners$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          enabledExtension = function _ref2(info) {
            if (info.id === MAC_ADDON_ID) {
              macAddonEnabled = true;
            }
          };

          disabledExtension = function _ref(info) {
            if (info.id === MAC_ADDON_ID) {
              macAddonEnabled = false;
            }
          };

          browser.runtime.onMessageExternal.addListener(function (message, sender) {
            if (sender.id !== "@testpilot-containers") {
              return;
            }

            switch (message.method) {
              case "MACListening":
                sendJailedDomainsToMAC();
                break;
            }
          });
          browser.management.onInstalled.addListener(enabledExtension);
          browser.management.onEnabled.addListener(enabledExtension);
          browser.management.onUninstalled.addListener(disabledExtension);
          browser.management.onDisabled.addListener(disabledExtension);

        case 7:
        case "end":
          return _context2.stop();
      }
    }
  });
}

function sendJailedDomainsToMAC() {
  return regeneratorRuntime.async(function sendJailedDomainsToMAC$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(browser.runtime.sendMessage(MAC_ADDON_ID, {
            method: "jailedDomains",
            urls: ALIBABA_DOMAINS.map(function (domain) {
              return "https://".concat(domain, "/");
            })
          }));

        case 3:
          return _context3.abrupt("return", _context3.sent);

        case 6:
          _context3.prev = 6;
          _context3.t0 = _context3["catch"](0);
          return _context3.abrupt("return", false);

        case 9:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 6]]);
}

function getMACAssignment(url) {
  var assignment;
  return regeneratorRuntime.async(function getMACAssignment$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          if (macAddonEnabled) {
            _context4.next = 2;
            break;
          }

          return _context4.abrupt("return", false);

        case 2:
          _context4.prev = 2;
          _context4.next = 5;
          return regeneratorRuntime.awrap(browser.runtime.sendMessage(MAC_ADDON_ID, {
            method: "getAssignment",
            url: url
          }));

        case 5:
          assignment = _context4.sent;
          return _context4.abrupt("return", assignment);

        case 9:
          _context4.prev = 9;
          _context4.t0 = _context4["catch"](2);
          return _context4.abrupt("return", false);

        case 12:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[2, 9]]);
}

function cancelRequest(tab, options) {
  // we decided to cancel the request at this point, register canceled request
  canceledRequests[tab.id] = {
    requestIds: _defineProperty({}, options.requestId, true),
    urls: _defineProperty({}, options.url, true)
  }; // since webRequest onCompleted and onErrorOccurred are not 100% reliable
  // we register a timer here to cleanup canceled requests, just to make sure we don't
  // end up in a situation where certain urls in a tab.id stay canceled

  setTimeout(function () {
    if (canceledRequests[tab.id]) {
      delete canceledRequests[tab.id];
    }
  }, 2000);
}

function shouldCancelEarly(tab, options) {
  // we decided to cancel the request at this point
  if (!canceledRequests[tab.id]) {
    cancelRequest(tab, options);
  } else {
    var cancelEarly = false;

    if (canceledRequests[tab.id].requestIds[options.requestId] || canceledRequests[tab.id].urls[options.url]) {
      // same requestId or url from the same tab
      // this is a redirect that we have to cancel early to prevent opening two tabs
      cancelEarly = true;
    } // register this requestId and url as canceled too


    canceledRequests[tab.id].requestIds[options.requestId] = true;
    canceledRequests[tab.id].urls[options.url] = true;

    if (cancelEarly) {
      return true;
    }
  }

  return false;
}

function generateAlibabaHostREs() {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = ALIBABA_DOMAINS[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var alibabaDomain = _step.value;
      alibabaHostREs.push(new RegExp("^(.*\\.)?".concat(alibabaDomain, "$")));
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}

function clearAlibabaCookies() {
  var containers, macAssignments, promises;
  return regeneratorRuntime.async(function clearAlibabaCookies$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.next = 2;
          return regeneratorRuntime.awrap(browser.contextualIdentities.query({}));

        case 2:
          containers = _context8.sent;
          containers.push({
            cookieStoreId: "firefox-default"
          });
          macAssignments = [];

          if (!macAddonEnabled) {
            _context8.next = 10;
            break;
          }

          promises = ALIBABA_DOMAINS.map(function _callee(alibabaDomain) {
            var assigned;
            return regeneratorRuntime.async(function _callee$(_context5) {
              while (1) {
                switch (_context5.prev = _context5.next) {
                  case 0:
                    _context5.next = 2;
                    return regeneratorRuntime.awrap(getMACAssignment("https://".concat(alibabaDomain, "/")));

                  case 2:
                    assigned = _context5.sent;
                    return _context5.abrupt("return", assigned ? alibabaDomain : null);

                  case 4:
                  case "end":
                    return _context5.stop();
                }
              }
            });
          });
          _context8.next = 9;
          return regeneratorRuntime.awrap(Promise.all(promises));

        case 9:
          macAssignments = _context8.sent;

        case 10:
          ALIBABA_DOMAINS.map(function _callee3(alibabaDomain) {
            var alibabaCookieUrl;
            return regeneratorRuntime.async(function _callee3$(_context7) {
              while (1) {
                switch (_context7.prev = _context7.next) {
                  case 0:
                    alibabaCookieUrl = "https://".concat(alibabaDomain, "/"); // dont clear cookies for alibabaDomain if mac assigned (with or without www.)

                    if (!(macAddonEnabled && (macAssignments.includes(alibabaDomain) || macAssignments.includes("www.".concat(alibabaDomain))))) {
                      _context7.next = 3;
                      break;
                    }

                    return _context7.abrupt("return");

                  case 3:
                    containers.map(function _callee2(container) {
                      var storeId, cookies;
                      return regeneratorRuntime.async(function _callee2$(_context6) {
                        while (1) {
                          switch (_context6.prev = _context6.next) {
                            case 0:
                              storeId = container.cookieStoreId;

                              if (!(storeId === alibabaCookieStoreId)) {
                                _context6.next = 3;
                                break;
                              }

                              return _context6.abrupt("return");

                            case 3:
                              _context6.next = 5;
                              return regeneratorRuntime.awrap(browser.cookies.getAll({
                                domain: alibabaDomain,
                                storeId: storeId
                              }));

                            case 5:
                              cookies = _context6.sent;
                              cookies.map(function (cookie) {
                                browser.cookies.remove({
                                  name: cookie.name,
                                  url: alibabaCookieUrl,
                                  storeId: storeId
                                });
                              }); // Also clear Service Workers as it breaks detecting onBeforeRequest

                              _context6.next = 9;
                              return regeneratorRuntime.awrap(browser.browsingData.remove({
                                hostnames: [alibabaDomain]
                              }, {
                                serviceWorkers: true
                              }));

                            case 9:
                            case "end":
                              return _context6.stop();
                          }
                        }
                      });
                    });

                  case 4:
                  case "end":
                    return _context7.stop();
                }
              }
            });
          });

        case 11:
        case "end":
          return _context8.stop();
      }
    }
  });
}

function setupContainer() {
  var info, contexts, alibabaContext, context, azcStorage;
  return regeneratorRuntime.async(function setupContainer$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.next = 2;
          return regeneratorRuntime.awrap(browser.runtime.getBrowserInfo());

        case 2:
          info = _context9.sent;

          if (parseInt(info.version) < 67) {
            ALIBABA_CONTAINER_DETAILS.color = "orange";
            ALIBABA_CONTAINER_DETIALS.color = "briefcase";
          }

          _context9.next = 6;
          return regeneratorRuntime.awrap(browser.contextualIdentities.query({
            name: ALIBABA_CONTAINER_DETAILS.name
          }));

        case 6:
          contexts = _context9.sent;

          if (!(contexts.length > 0)) {
            _context9.next = 15;
            break;
          }

          alibabaContext = contexts[0];
          alibabaCookieStoreId = alibabaContext.cookieStoreId;

          if (!(alibabaContext.color !== ALIBABA_CONTAINER_DETAILS.color || alibabaContext.icon !== ALIBABA_CONTAINER_DETAILS.icon)) {
            _context9.next = 13;
            break;
          }

          _context9.next = 13;
          return regeneratorRuntime.awrap(browser.contextualIdentities.update(alibabaCookieStoreId, {
            color: ALIBABA_CONTAINER_DETAILS.color,
            icon: ALIBABA_CONTAINER_DETAILS.icon
          }));

        case 13:
          _context9.next = 19;
          break;

        case 15:
          _context9.next = 17;
          return regeneratorRuntime.awrap(browser.contextualIdentities.create(ALIBABA_CONTAINER_DETAILS));

        case 17:
          context = _context9.sent;
          alibabaCookieStoreId = context.cookieStoreId;

        case 19:
          _context9.next = 21;
          return regeneratorRuntime.awrap(browser.storage.local.get());

        case 21:
          azcStorage = _context9.sent;

          if (azcStorage.domainsAddedToAlibabaContainer) {
            _context9.next = 25;
            break;
          }

          _context9.next = 25;
          return regeneratorRuntime.awrap(browser.storage.local.set({
            "domainsAddedToAlibabaContainer": []
          }));

        case 25:
        case "end":
          return _context9.stop();
      }
    }
  });
}

function maybeReopenTab(url, tab, request) {
  var macAssigned, cookieStoreId;
  return regeneratorRuntime.async(function maybeReopenTab$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          _context10.next = 2;
          return regeneratorRuntime.awrap(getMACAssignment(url));

        case 2:
          macAssigned = _context10.sent;

          if (!macAssigned) {
            _context10.next = 5;
            break;
          }

          return _context10.abrupt("return");

        case 5:
          _context10.next = 7;
          return regeneratorRuntime.awrap(shouldContainInto(url, tab));

        case 7:
          cookieStoreId = _context10.sent;

          if (cookieStoreId) {
            _context10.next = 10;
            break;
          }

          return _context10.abrupt("return");

        case 10:
          if (!(request && shouldCancelEarly(tab, request))) {
            _context10.next = 12;
            break;
          }

          return _context10.abrupt("return", {
            cancel: true
          });

        case 12:
          _context10.next = 14;
          return regeneratorRuntime.awrap(browser.tabs.create({
            url: url,
            cookieStoreId: cookieStoreId,
            active: tab.active,
            index: tab.index,
            windowId: tab.windowId
          }));

        case 14:
          browser.tabs.remove(tab.id);
          return _context10.abrupt("return", {
            cancel: true
          });

        case 16:
        case "end":
          return _context10.stop();
      }
    }
  });
}

function isAlibabaURL(url) {
  var parsedUrl = new URL(url);
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = alibabaHostREs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var alibabaHostRE = _step2.value;

      if (alibabaHostRE.test(parsedUrl.host)) {
        return true;
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
        _iterator2["return"]();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return false;
}

function supportsSiteSubdomainCheck(url) {
  return regeneratorRuntime.async(function supportsSiteSubdomainCheck$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          return _context11.abrupt("return");

        case 1:
        case "end":
          return _context11.stop();
      }
    }
  });
}

function addDomainToAlibabaContainer(url) {
  var parsedUrl, azcStorage;
  return regeneratorRuntime.async(function addDomainToAlibabaContainer$(_context12) {
    while (1) {
      switch (_context12.prev = _context12.next) {
        case 0:
          parsedUrl = new URL(url);
          _context12.next = 3;
          return regeneratorRuntime.awrap(browser.storage.local.get());

        case 3:
          azcStorage = _context12.sent;
          azcStorage.domainsAddedToAlibabaContainer.push(parsedUrl.host);
          _context12.next = 7;
          return regeneratorRuntime.awrap(browser.storage.local.set({
            "domainsAddedToAlibabaContainer": azcStorage.domainsAddedToAlibabaContainer
          }));

        case 7:
          _context12.next = 9;
          return regeneratorRuntime.awrap(supportSiteSubdomainCheck(parsedUrl.host));

        case 9:
        case "end":
          return _context12.stop();
      }
    }
  });
}

function removeDomainFromAlibabaContainer(domain) {
  var azcStorage, domainIndex;
  return regeneratorRuntime.async(function removeDomainFromAlibabaContainer$(_context13) {
    while (1) {
      switch (_context13.prev = _context13.next) {
        case 0:
          _context13.next = 2;
          return regeneratorRuntime.awrap(browser.storage.local.get());

        case 2:
          azcStorage = _context13.sent;
          domainIndex = azcStorage.domainsAddedToAlibabaContainer.indexOf(domain);
          azcStorage.domainsAddedToAlibabaContainer.splice(domainIndex, 1);
          _context13.next = 7;
          return regeneratorRuntime.awrap(browser.storage.local.set({
            "domainsAddedToAlibabaContainer": azcStorage.domainsAddedToAlibabaContainer
          }));

        case 7:
        case "end":
          return _context13.stop();
      }
    }
  });
}

function isAddedToAlibabaContainer(url) {
  var parsedUrl, azcStorage;
  return regeneratorRuntime.async(function isAddedToAlibabaContainer$(_context14) {
    while (1) {
      switch (_context14.prev = _context14.next) {
        case 0:
          parsedUrl = new URL(url);
          _context14.next = 3;
          return regeneratorRuntime.awrap(browser.storage.local.get());

        case 3:
          azcStorage = _context14.sent;

          if (!azcStorage.domainsAddedToAlibabaContainer.includes(parsedUrl.host)) {
            _context14.next = 6;
            break;
          }

          return _context14.abrupt("return", true);

        case 6:
          return _context14.abrupt("return", false);

        case 7:
        case "end":
          return _context14.stop();
      }
    }
  });
}

function shouldContainInto(url, tab) {
  var hasBeenAddedToAlibabaContainer;
  return regeneratorRuntime.async(function shouldContainInto$(_context15) {
    while (1) {
      switch (_context15.prev = _context15.next) {
        case 0:
          if (url.startsWith("http")) {
            _context15.next = 2;
            break;
          }

          return _context15.abrupt("return", false);

        case 2:
          _context15.next = 4;
          return regeneratorRuntime.awrap(isAddedToAlibabaContainer(url));

        case 4:
          hasBeenAddedToAlibabaContainer = _context15.sent;

          if (!(isAlibabaURL(url) || hasBeenAddedToAlibabaContainer)) {
            _context15.next = 10;
            break;
          }

          if (!(tab.cookieStoreId !== alibabaCookieStoreId)) {
            _context15.next = 8;
            break;
          }

          return _context15.abrupt("return", alibabaCookieStoreId);

        case 8:
          _context15.next = 12;
          break;

        case 10:
          if (!(tab.cookieStoreId === alibabaCookieStoreId)) {
            _context15.next = 12;
            break;
          }

          return _context15.abrupt("return", "firefox-default");

        case 12:
          return _context15.abrupt("return", false);

        case 13:
        case "end":
          return _context15.stop();
      }
    }
  });
}

function maybeReopenAlreadyOpenTabs() {
  var tabsOnUpdated, tabs;
  return regeneratorRuntime.async(function maybeReopenAlreadyOpenTabs$(_context17) {
    while (1) {
      switch (_context17.prev = _context17.next) {
        case 0:
          tabsOnUpdated = function tabsOnUpdated(tabId, changeInfo, tab) {
            if (changeInfo.url && tabsWaitingToLoad[tabId]) {
              // Tab we're waiting for switched it's url, maybe we reopen
              delete tabsWaitingToLoad[tabId];
              maybeReopenTab(tab.url, tab);
            }

            if (tab.status === "complete" && tabsWaitingToLoad[tabId]) {
              // Tab we're waiting for completed loading
              delete tabsWaitingToLoad[tabId];
            }

            if (!Object.keys(tabsWaitingToLoad).length) {
              // We're done waiting for tabs to load, remove event listener
              browser.tabs.onUpdated.removeListener(tabsOnUpdated);
            }
          }; // Query for already open Tabs


          _context17.next = 3;
          return regeneratorRuntime.awrap(browser.tabs.query({}));

        case 3:
          tabs = _context17.sent;
          tabs.map(function _callee4(tab) {
            return regeneratorRuntime.async(function _callee4$(_context16) {
              while (1) {
                switch (_context16.prev = _context16.next) {
                  case 0:
                    if (!(tab.url === "about:blank")) {
                      _context16.next = 7;
                      break;
                    }

                    if (!(tab.status !== "loading")) {
                      _context16.next = 3;
                      break;
                    }

                    return _context16.abrupt("return");

                  case 3:
                    // about:blank Tab is still loading, so we indicate that we wait for it to load
                    // and register the event listener if we haven't yet.
                    //
                    // This is a workaround until platform support is implemented:
                    // https://bugzilla.mozilla.org/show_bug.cgi?id=1447551
                    // https...
                    tabsWaitingToLoad[tab.id] = true;

                    if (!browser.tabs.onUpdated.hasListener(tabsOnUpdated)) {
                      browser.tabs.onUpdated.addListener(tabsOnUpdated);
                    }

                    _context16.next = 8;
                    break;

                  case 7:
                    // Tab already has an url, maybe we reopen
                    maybeReopenTab(tab.url, tab);

                  case 8:
                  case "end":
                    return _context16.stop();
                }
              }
            });
          });

        case 5:
        case "end":
          return _context17.stop();
      }
    }
  });
}

function stripAzclid(url) {
  var strippedUrl = new URL(url);
  strippedUrl.searchParams["delete"]("azclid");
  return strippedUrl.href;
}

function getActiveTab() {
  var _ref3, _ref4, activeTab;

  return regeneratorRuntime.async(function getActiveTab$(_context18) {
    while (1) {
      switch (_context18.prev = _context18.next) {
        case 0:
          _context18.next = 2;
          return regeneratorRuntime.awrap(browser.tabs.query({
            currentWindow: true,
            active: true
          }));

        case 2:
          _ref3 = _context18.sent;
          _ref4 = _slicedToArray(_ref3, 1);
          activeTab = _ref4[0];
          return _context18.abrupt("return", activeTab);

        case 6:
        case "end":
          return _context18.stop();
      }
    }
  });
}

function windowFocusChangedListener(windowId) {
  var activeTab;
  return regeneratorRuntime.async(function windowFocusChangedListener$(_context19) {
    while (1) {
      switch (_context19.prev = _context19.next) {
        case 0:
          if (!(windowId !== browser.windows.WINDOW_ID_NONE)) {
            _context19.next = 5;
            break;
          }

          _context19.next = 3;
          return regeneratorRuntime.awrap(getActiveTab());

        case 3:
          activeTab = _context19.sent;
          updateBrowserActionIcon(activeTab);

        case 5:
        case "end":
          return _context19.stop();
      }
    }
  });
}

function tabUpdateListener(tabId, changeInfo, tab) {
  updateBrowserActionIcon(tab);
}

function updateBrowserActionIcon(tab) {
  var url, hasBeenAddedToAlibabaContainer, tabState, panelToShow;
  return regeneratorRuntime.async(function updateBrowserActionIcon$(_context20) {
    while (1) {
      switch (_context20.prev = _context20.next) {
        case 0:
          browser.browserAction.setBadgeText({
            text: ""
          });
          url = tab.url;
          _context20.next = 4;
          return regeneratorRuntime.awrap(isAddedToAlibabaContainer(url));

        case 4:
          hasBeenAddedToAlibabaContainer = _context20.sent;

          if (isAlibabaURL(url)) {
            browser.storage.local.set({
              "CURRENT_PANEL": "on-alibaba"
            });
            browser.browserAction.setPopup({
              tabId: tab.id,
              popup: "./panel.html"
            });
          } else if (hasBeenAddedToAlibabaContainer) {
            browser.storage.local.set({
              "CURRENT_PANEL": "in-azc"
            });
          } else {
            tabState = tabStates[tab.id];
            panelToShow = tabState && tabState.trackersDetected ? "trackers-detected" : "no-trackers";
            browser.storage.local.set({
              "CURRENT_PANEL": panelToShow
            });
            browser.browserAction.setPopup({
              tabId: tab.id,
              popup: "./panel.html"
            });
            browser.browserAction.setBadgeBackgroundColor({
              color: "#A44D00"
            });

            if (panelToShow === "trackers-detected") {
              browser.browserAction.setBadgeText({
                text: "!"
              });
            }
          }

        case 6:
        case "end":
          return _context20.stop();
      }
    }
  });
}

function containAlibaba(request) {
  var tab, url, urlSearchParm;
  return regeneratorRuntime.async(function containAlibaba$(_context21) {
    while (1) {
      switch (_context21.prev = _context21.next) {
        case 0:
          if (tabsWaitingToLoad[request.tabId]) {
            // Cleanup just to make sure we don't get a race-condition with startup reopening
            delete tabsWaitingToLoad[request.tabId];
          }

          _context21.next = 3;
          return regeneratorRuntime.awrap(browser.tabs.get(request.tabId));

        case 3:
          tab = _context21.sent;
          updateBrowserActionIcon(tab);
          url = new URL(request.url);
          urlSearchParm = new URLSearchParams(url.search);

          if (!urlSearchParm.has("azclid")) {
            _context21.next = 9;
            break;
          }

          return _context21.abrupt("return", {
            redirectUrl: stripAzclid(request.url)
          });

        case 9:
          if (!(request.tabId === -1)) {
            _context21.next = 11;
            break;
          }

          return _context21.abrupt("return");

        case 11:
          return _context21.abrupt("return", maybeReopenTab(request.url, tab, request));

        case 12:
        case "end":
          return _context21.stop();
      }
    }
  });
} // Lots of this is borrowed from old blok code:
// https://github.com/mozilla/blok/blob/master/src/js/background.js


function blockAlibabaSubResources(requestDetails) {
  var urlIsAlibaba, originUrlIsAlibaba, message, hasBeenAddedToAlibabaContainer, _message, _message2;

  return regeneratorRuntime.async(function blockAlibabaSubResources$(_context22) {
    while (1) {
      switch (_context22.prev = _context22.next) {
        case 0:
          if (!(requestDetails.type === "main_frame")) {
            _context22.next = 2;
            break;
          }

          return _context22.abrupt("return", {});

        case 2:
          if (!(typeof requestDetails.originUrl === "undefined")) {
            _context22.next = 4;
            break;
          }

          return _context22.abrupt("return", {});

        case 4:
          urlIsAlibaba = isAlibabaURL(requestDetails.url);
          originUrlIsAlibaba = isAlibabaURL(requestDetails.originUrl);

          if (urlIsAlibaba) {
            _context22.next = 8;
            break;
          }

          return _context22.abrupt("return", {});

        case 8:
          if (!originUrlIsAlibaba) {
            _context22.next = 12;
            break;
          }

          message = {
            msg: "alibaba-domain"
          }; // Send the message to the content_script

          browser.tabs.sendMessage(requestDetails.tabId, message);
          return _context22.abrupt("return", {});

        case 12:
          _context22.next = 14;
          return regeneratorRuntime.awrap(isAddedToAlibabaContainer(requestDetails.originUrl));

        case 14:
          hasBeenAddedToAlibabaContainer = _context22.sent;

          if (!(urlIsAlibaba && !originUrlIsAlibaba)) {
            _context22.next = 26;
            break;
          }

          if (hasBeenAddedToAlibabaContainer) {
            _context22.next = 23;
            break;
          }

          _message = {
            msg: "blocked-alibaba-subresources"
          }; // Send the message to the content_script

          browser.tabs.sendMessage(requestDetails.tabId, _message);
          tabStates[requestDetails.tabId] = {
            trackersDetected: true
          };
          return _context22.abrupt("return", {
            cancel: true
          });

        case 23:
          _message2 = {
            msg: "allowed-alibaba-subresources"
          }; // Send the message to the content_script

          browser.tabs.sendMessage(requestDetails.tabId, _message2);
          return _context22.abrupt("return", {});

        case 26:
          return _context22.abrupt("return", {});

        case 27:
        case "end":
          return _context22.stop();
      }
    }
  });
}

function setupWebRequestListeners() {
  browser.webRequest.onCompleted.addListener(function (options) {
    if (canceledRequests[options.tabId]) {
      delete canceledRequests[options.tabId];
    }
  }, {
    urls: ["<all_urls>"],
    types: ["main_frame"]
  });
  browser.webRequest.onErrorOccurred.addListener(function (options) {
    if (canceledRequests[options.tabId]) {
      delete canceledRequests[options.tabId];
    }
  }, {
    urls: ["<all_urls>"],
    types: ["main_frame"]
  }); // Add the main_frame request listener

  browser.webRequest.onBeforeRequest.addListener(containAlibaba, {
    urls: ["<all_urls>"],
    types: ["main_frame"]
  }, ["blocking"]); // Add the sub-resource request listener

  browser.webRequest.onBeforeRequest.addListener(blockAlibabaSubResources, {
    urls: ["<all_urls>"]
  }, ["blocking"]);
}

function setupWindowsAndTabsListeners() {
  browser.tabs.onUpdated.addListener(tabUpdateListener);
  browser.tabs.onRemoved.addListener(function (tabId) {
    return delete tabStates[tabId];
  });
  browser.windows.onFocusChanged.addListener(windowFocusChangedListener);
}

(function init() {
  var activeTab;
  return regeneratorRuntime.async(function init$(_context23) {
    while (1) {
      switch (_context23.prev = _context23.next) {
        case 0:
          _context23.next = 2;
          return regeneratorRuntime.awrap(setupMACAddonListeners());

        case 2:
          _context23.next = 4;
          return regeneratorRuntime.awrap(isMACAddonEnabled());

        case 4:
          macAddonEnabled = _context23.sent;
          _context23.prev = 5;
          _context23.next = 8;
          return regeneratorRuntime.awrap(setupContainer());

        case 8:
          _context23.next = 14;
          break;

        case 10:
          _context23.prev = 10;
          _context23.t0 = _context23["catch"](5);
          // TODO: Needs backup strategy
          // See ...
          // Sometimes this add-on is installed but doesn't get a alibabaCookieStoreId ?
          // eslint-disable-next-line no-console
          console.log(_context23.t0);
          return _context23.abrupt("return");

        case 14:
          clearAlibabaCookies();
          generateAlibabaHostREs();
          setupWebRequestListeners();
          setupWindowsAndTabsListeners();
          browser.runtime.onMessage.addListener(function (message, _ref5) {
            var url = _ref5.url;

            if (message === "what-sites-are-added") {
              return browser.storage.local.get().then(function (azcStorage) {
                return azcStorage.domainsAddedToAlibabaContainer;
              });
            } else if (message.removeDomain) {
              removeDomainFromAlibabaContainer(message.removeDomain).then(function (results) {
                return results;
              });
            } else {
              addDomainToAlibabaContainer(url).then(function (results) {
                return results;
              });
            }
          });
          maybeReopenAlreadyOpenTabs();
          _context23.next = 22;
          return regeneratorRuntime.awrap(getActiveTab());

        case 22:
          activeTab = _context23.sent;
          updateBrowserActionIcon(activeTab);

        case 24:
        case "end":
          return _context23.stop();
      }
    }
  }, null, null, [[5, 10]]);
})();