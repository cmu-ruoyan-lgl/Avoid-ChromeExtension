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
      // 处理URL，获取纯净URL
      let cleanUrl;
      try {
        const urlObj = new URL(currentUrl);
        // 对于bilibili视频页面的特殊处理
        if (urlObj.hostname.includes('bilibili.com') && urlObj.pathname.includes('/video/')) {
          // 提取视频ID (BV号)
          const bvMatch = urlObj.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/);
          if (bvMatch) {
            cleanUrl = `${urlObj.origin}/video/${bvMatch[1]}`;
          }
        } else {
          // 其他网页只保留 origin 和 pathname
          cleanUrl = urlObj.origin + urlObj.pathname;
        }
      } catch (e) {
        cleanUrl = currentUrl;
      }

      console.log('Original URL:', currentUrl);
      console.log('Clean URL:', cleanUrl);

      const textarea = document.getElementById('killList');
      const urls = textarea.value.split('\n').filter(url => url.trim());
      if (!urls.includes(cleanUrl)) {
        urls.push(cleanUrl);
        textarea.value = urls.join('\n');
        saveKillList(urls);
      }
    });
  });

  // 导入按钮点击事件
  document.getElementById('importBtn').addEventListener('click', function() {
    document.getElementById('fileInput').click();
  });

  // 文件选择变化事件
  document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
      try {
        // 读取文件内容
        const content = e.target.result;
        
        // 将文件内容按行分割并过滤空行
        const importedUrls = content.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        // 获取当前已有的URL列表
        chrome.storage.local.get(['killList'], function(result) {
          const currentUrls = result.killList || [];
          
          // 合并并去重
          const mergedUrls = Array.from(new Set([...currentUrls, ...importedUrls]));
          
          // 更新textarea显示
          document.getElementById('killList').value = mergedUrls.join('\n');
          
          // 保存到storage
          chrome.storage.local.set({
            killList: mergedUrls
          }, function() {
            if (chrome.runtime.lastError) {
              alert('保存失败：' + chrome.runtime.lastError.message);
            } else {
              alert(`成功导入！\n新增: ${importedUrls.length} 个网址\n当前共有: ${mergedUrls.length} 个网址`);
            }
          });
        });
      } catch (error) {
        alert('处理文件时出错：' + error.message);
      }
    };

    reader.onerror = function() {
      alert('读取文件时出错');
    };

    // 以文本格式读取文件
    reader.readAsText(file);
    
    // 清除input的value，这样同一个文件可以重复导入
    event.target.value = '';
  });

  // 导出功能
  document.getElementById('exportBtn').addEventListener('click', function() {
    const content = document.getElementById('killList').value;
    const blob = new Blob([content], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const timestamp = now.toISOString().slice(0,19).replace(/[:-]/g, '');
    const defaultFilename = `blocked_sites_${timestamp}.txt`;

    chrome.downloads.download({
      url: url,
      filename: defaultFilename,
      saveAs: true // 允许用户选择保存位置和文件名
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
