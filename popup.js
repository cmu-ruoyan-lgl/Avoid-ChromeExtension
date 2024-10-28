document.addEventListener('DOMContentLoaded', function() {
  // 加载已保存的屏蔽列表
  chrome.storage.local.get(['killList', 'blockMessage'], function(result) {
    if (result.killList) {
      document.getElementById('killList').value = result.killList.join('\n');
    }
    
    // 显示屏蔽提示消息
    if (result.blockMessage) {
      const messageDiv = document.getElementById('blockMessage');
      messageDiv.textContent = result.blockMessage;
      messageDiv.style.display = 'block';
      // 5秒后清除消息
      setTimeout(() => {
        messageDiv.style.display = 'none';
        chrome.storage.local.remove('blockMessage');
      }, 5000);
    }
  });

  // 添加当前网页到屏蔽列表
  document.getElementById('addCurrent').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0].url;
      const textarea = document.getElementById('killList');
      const urls = textarea.value.split('\n').filter(url => url.trim());
      if (!urls.includes(currentUrl)) {
        urls.push(currentUrl);
        textarea.value = urls.join('\n');
        saveKillList(urls);
      }
    });
  });

  // 保存修改
  document.getElementById('save').addEventListener('click', function() {
    const urls = document.getElementById('killList').value.split('\n').filter(url => url.trim());
    saveKillList(urls);
  });
});

function saveKillList(urls) {
  chrome.storage.local.set({killList: urls}, function() {
    alert('保存成功！');
  });
}
