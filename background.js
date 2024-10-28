// 检查URL是否匹配屏蔽列表
function isUrlBlocked(url, patterns) {
  return patterns.some(pattern => {
    try {
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        // 正则表达式匹配
        const regex = new RegExp(pattern.slice(1, -1));
        return regex.test(url);
      } else {
        // 普通URL或前缀匹配
        return url.startsWith(pattern);
      }
    } catch (e) {
      return false;
    }
  });
}

// 显示通知
function showBlockNotification(url) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon48.png',  // 需要添加一个图标文件
    title: '网页已被屏蔽',
    message: '已阻止访问: ' + url
  });

  // 同时更新存储中的消息，以便在popup中也能显示
  chrome.storage.local.set({blockMessage: '已屏蔽网址: ' + url});

  // 打开扩展程序的popup
  chrome.action.openPopup();
}

// 监听页面导航
chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  chrome.storage.local.get(['killList'], function(result) {
    if (result.killList && isUrlBlocked(details.url, result.killList)) {
      // 关闭匹配的标签页
      chrome.tabs.remove(details.tabId);
      // 显示通知
      showBlockNotification(details.url);
    }
  });
});
