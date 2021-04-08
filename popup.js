// -*- coding: utf-8 -*-

// Copyright 2021 Susumu OTA
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const DARK_THEME_CSS = 'html { background-color: #121212; color: darkgray; } div.source { color: skyblue; }';

// send css to translation.js
const setCSS = (css) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
       message: 'setCSS',
       css: css
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else if (response) {
        resolve(response);
      }
      reject('Empty response');
    });
  });
}


window.addEventListener('load', async () => {
  const targetLang = document.getElementById('target_lang');
  const themeLight = document.getElementById('theme_light');
  const themeDark = document.getElementById('theme_dark');
  const message = document.getElementById('message');
  const windowWidth = document.getElementById('window_width');
  const windowHeight = document.getElementById('window_height');
  const windowTop = document.getElementById('window_top');
  const windowLeft = document.getElementById('window_left');
  const config = await getConfig();

  // set current values
  if (config.targetLang && config.targetLang !== 'auto') {
    document.getElementById(`target_lang_${config.targetLang}`).selected = true;
  }
  if (!config.translationCSS) {
    themeLight.checked = true;
  } else if (config.translationCSS === DARK_THEME_CSS) {
    themeDark.checked = true;
  } else {
    // TODO: what to do?
  }
  if (config.translationTabParams && config.translationTabParams.createWindow) {
    const w = config.translationTabParams.createWindow;
    windowWidth.value = w.width;
    windowHeight.value = w.height;
    windowTop.value = w.top;
    windowLeft.value = w.left;
  } else {
    // TODO: what to do?
  }

  // event listeners
  targetLang.addEventListener('change', (event) => {
    console.assert(targetLang.value);
    setConfig({targetLang: targetLang.value});
    message.textContent = `Target Language: "${targetLang.value}". This change will take effect in the next translation.`;
  });
  const addEventListenerToTheme = (elm, css) => {
    elm.addEventListener('change', async (event) => {
      console.assert(elm.value);
      message.textContent = 'Applying Color Theme...';
      setConfig({translationCSS: css});
      try {
        await setCSS(css === null ? '' : css); // apply css immediately
      } catch (err) {
        console.log(err);
      }
      message.textContent = `Color Theme: "${elm.value}"`;
    });
  };
  addEventListenerToTheme(themeLight, null);
  addEventListenerToTheme(themeDark, DARK_THEME_CSS);
  const addEventListenerToWindow = (elm, elmName) => {
    elm.addEventListener('change', (event) => {
      if (/[^\d]+/.test(elm.value) || isNaN(parseInt(elm.value))) {
        message.textContent = `Invalid value: "${elm.value}". Specify an integer >= 0.`;
        return;
      }
      const params = deepCopy(config.translationTabParams);
      params.createWindow[elmName] = parseInt(elm.value);
      setConfig({translationTabParams: params});
      message.textContent = `Window ${elmName}: "${elm.value}". Close the translation window and try to translate again.`;
    });
  };
  addEventListenerToWindow(windowWidth, 'width');
  addEventListenerToWindow(windowHeight, 'height');
  addEventListenerToWindow(windowTop, 'top');
  addEventListenerToWindow(windowLeft, 'left');
});
