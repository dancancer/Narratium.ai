/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         Slash Runner API Shim                              ║
 * ║                                                                            ║
 * ║  注入到 iframe 沙箱中，提供以下能力：                                       ║
 * ║  • window.Narratium - 新版 API                                            ║
 * ║  • window.TavernHelper - 兼容 SillyTavern 的 API                          ║
 * ║  • window.SillyTavern - 兼容层                                            ║
 * ║  • 高度自动更新                                                            ║
 * ║  • 父子窗口消息通信                                                        ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

(function() {
  "use strict";

  // ════════════════════════════════════════════════════════════════════════
  //  基础设施
  // ════════════════════════════════════════════════════════════════════════

  var pending = new Map();
  var variableCache = {};

  function createId() {
    return "sr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  function sendMessage(type, payload) {
    window.parent.postMessage({
      type: type,
      payload: payload,
      id: payload && payload.id,
      timestamp: Date.now(),
      origin: window.location.origin
    }, "*");
  }

  // ════════════════════════════════════════════════════════════════════════
  //  高度更新：参考 JS-Slash-Runner 的实现
  //  核心策略：scheduled 锁 + rAF 去抖 + 纯 ResizeObserver（不用 MutationObserver subtree）
  // ════════════════════════════════════════════════════════════════════════

  var scheduled = false;
  var lastReportedHeight = 0;

  function measureAndPost() {
    scheduled = false;
    var body = document.body;
    if (!body) return;

    var h = body.scrollHeight || 0;
    if (h <= 0 || Math.abs(h - lastReportedHeight) < 5) return;

    lastReportedHeight = h;
    sendMessage("HEIGHT_UPDATE", { height: h });
  }

  function postHeight() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(measureAndPost);
  }

  function setupHeightObserver() {
    var body = document.body;

    function observe() {
      // 只用 ResizeObserver 监听 body 尺寸变化
      var resizeObserver = new ResizeObserver(postHeight);
      resizeObserver.observe(document.body);

      // MutationObserver 只监听直接子元素变化，不监听 subtree
      var mutationObserver = new MutationObserver(function() {
        // 子元素变化时，重新观察新元素
        resizeObserver.disconnect();
        resizeObserver.observe(document.body);
        for (var i = 0; i < document.body.children.length; i++) {
          resizeObserver.observe(document.body.children[i]);
        }
      });
      mutationObserver.observe(document.body, { childList: true, subtree: false, attributes: false });

      postHeight();
    }

    if (body) {
      observe();
    } else {
      document.addEventListener("DOMContentLoaded", observe);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  API 调用
  // ════════════════════════════════════════════════════════════════════════

  function callApi(method, args) {
    return new Promise(function(resolve, reject) {
      var id = createId();
      pending.set(id, { resolve: resolve, reject: reject });
      sendMessage("API_CALL", { method: method, args: args, id: id });
      setTimeout(function() {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error("API_CALL timeout: " + method));
        }
      }, 240000);
    });
  }

  function log() {
    var args = Array.prototype.slice.call(arguments);
    var message = args.map(function(arg) {
      return typeof arg === "object" ? JSON.stringify(arg) : String(arg);
    }).join(" ");
    console.log("[SlashRunner]", message);
    sendMessage("CONSOLE_LOG", { message: message, args: args });
  }

  function api(method) {
    return function() {
      return callApi(method, Array.prototype.slice.call(arguments));
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Narratium API（新版）
  // ════════════════════════════════════════════════════════════════════════

  window.Narratium = {
    version: "1.0.0",
    variables: {
      get: function(key) { return variableCache[key]; },
      set: function(key, value) {
        variableCache[key] = value;
        sendMessage("API_CALL", { method: "setVariable", args: [key, value] });
      },
      delete: function(key) {
        delete variableCache[key];
        sendMessage("API_CALL", { method: "deleteVariable", args: [key] });
      },
      list: function() { return Object.keys(variableCache); }
    },
    events: {
      on: function(event, handler) {
        window.addEventListener("narratium:" + event, function(e) { handler(e.detail); });
      },
      once: function(event, handler) {
        var wrapper = function(e) {
          handler(e.detail);
          window.removeEventListener("narratium:" + event, wrapper);
        };
        window.addEventListener("narratium:" + event, wrapper);
      },
      off: function() {},
      emit: function(event, data) {
        window.dispatchEvent(new CustomEvent("narratium:" + event, { detail: data }));
        sendMessage("EVENT_EMIT", { eventName: event, data: data });
      }
    },
    utils: {
      log: log,
      waitFor: function(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  //  TavernHelper API（兼容层）
  // ════════════════════════════════════════════════════════════════════════

  window.TavernHelper = {
    variables: {
      get: function(key) { return window.Narratium.variables.get(key); },
      set: function(key, value) { window.Narratium.variables.set(key, value); },
      delete: function(key) { window.Narratium.variables.delete(key); },
      list: function() { return window.Narratium.variables.list(); }
    },
    events: {
      on: function(e, h) { window.Narratium.events.on(e, h); },
      once: function(e, h) { window.Narratium.events.once(e, h); },
      off: function(e, h) { window.Narratium.events.off(e, h); },
      emit: function(e, d) { window.Narratium.events.emit(e, d); }
    },
    utils: { log: log, waitFor: function(ms) { return window.Narratium.utils.waitFor(ms); } },
    log: log,
    // 聊天消息 API
    getChatMessages: function() { return callApi("getChatMessages", []); },
    setChatMessages: api("setChatMessages"),
    getCurrentMessageId: function() { return callApi("getCurrentMessageId", []); },
    eventEmit: function(event) {
      var data = Array.prototype.slice.call(arguments, 1);
      return callApi("eventEmit", [event].concat(data));
    },
    // 生成控制 API
    generate: api("generate"),
    generateRaw: api("generateRaw"),
    stopGenerationById: api("stopGenerationById"),
    stopAllGeneration: api("stopAllGeneration"),
    // Worldbook API
    getWorldbookNames: api("getWorldbookNames"),
    getGlobalWorldbookNames: api("getGlobalWorldbookNames"),
    rebindGlobalWorldbooks: api("worldbook.rebindGlobalWorldbooks"),
    getCharWorldbookNames: api("worldbook.getCharWorldbookNames"),
    rebindCharWorldbooks: api("worldbook.rebindCharWorldbooks"),
    getChatWorldbookName: api("worldbook.getChatWorldbookName"),
    rebindChatWorldbook: api("worldbook.rebindChatWorldbook"),
    getOrCreateChatWorldbook: api("worldbook.getOrCreateChatWorldbook"),
    createWorldbook: api("worldbook.createWorldbook"),
    createOrReplaceWorldbook: api("worldbook.createOrReplaceWorldbook"),
    deleteWorldbook: api("worldbook.deleteWorldbook"),
    replaceWorldbook: api("worldbook.replaceWorldbook"),
    updateWorldbookWith: api("worldbook.updateWorldbookWith"),
    createWorldbookEntries: api("worldbook.createWorldbookEntries"),
    deleteWorldbookEntries: api("worldbook.deleteWorldbookEntries"),
    importWorldbookFromJson: api("worldbook.importJson"),
    exportWorldbook: api("worldbook.export"),
    saveAsGlobalWorldbook: api("worldbook.saveAsGlobal"),
    importFromGlobalWorldbook: api("worldbook.importFromGlobal"),
    deleteGlobalWorldbook: api("worldbook.deleteGlobal"),
    // Lorebook API（旧版兼容）
    getLorebookEntries: api("lorebook.getEntries"),
    replaceLorebookEntries: api("lorebook.replaceEntries"),
    setLorebookEntries: api("lorebook.setEntries"),
    createLorebookEntries: api("lorebook.createEntries"),
    createLorebookEntry: api("lorebook.createEntry"),
    deleteLorebookEntries: api("lorebook.deleteEntries"),
    deleteLorebookEntry: api("lorebook.deleteEntry"),
    getLorebookSettings: api("lorebook.getSettings"),
    // Preset API
    getPresetNames: api("preset.getPresetNames"),
    getPreset: api("preset.getPreset"),
    createPreset: api("preset.createPreset"),
    createOrReplacePreset: api("preset.createOrReplacePreset"),
    deletePreset: api("preset.deletePreset"),
    renamePreset: api("preset.renamePreset"),
    replacePreset: api("preset.replacePreset"),
    updatePresetWith: api("preset.updatePresetWith"),
    setPreset: api("preset.setPreset"),
    getOrderedPrompts: api("preset.getOrderedPrompts"),
    loadPreset: api("preset.loadPreset"),
    getLoadedPresetName: api("preset.getLoadedPresetName"),
    importPreset: api("preset.importPreset")
  };

  // 兼容直接挂到 window 的旧用法
  window.getChatMessages = window.TavernHelper.getChatMessages;
  window.getCurrentMessageId = window.TavernHelper.getCurrentMessageId;
  window.eventEmit = window.TavernHelper.eventEmit;

  // SillyTavern 兼容层
  window.SillyTavern = {
    getContext: function() {
      return {
        variables: Object.assign({}, variableCache),
        sessionId: window.location.search || ""
      };
    },
    registerFunctionTool: function() {}
  };

  // ════════════════════════════════════════════════════════════════════════
  //  消息监听
  // ════════════════════════════════════════════════════════════════════════

  window.addEventListener("message", function(e) {
    if (!e.data) return;

    if (e.data.type === "EVENT_EMIT") {
      var payload = e.data.payload;
      window.dispatchEvent(new CustomEvent("narratium:" + payload.eventName, { detail: payload.data }));
    } else if (e.data.type === "UPDATE_VARIABLES") {
      Object.assign(variableCache, e.data.payload);
    } else if (e.data.type === "API_RESPONSE") {
      if (e.data.id && pending.has(e.data.id)) {
        var handler = pending.get(e.data.id);
        pending.delete(e.data.id);
        if (e.data.payload && e.data.payload.error) {
          handler.reject(new Error(e.data.payload.error));
        } else {
          handler.resolve(e.data.payload && e.data.payload.result);
        }
      }
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  //  初始化
  // ════════════════════════════════════════════════════════════════════════

  setupHeightObserver();

})();
