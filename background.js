// 获取纯净URL的函数
function getCleanUrl(url) {
  try {
    const urlObj = new URL(url);
    // 对于bilibili视频页面的特殊处理
    if (urlObj.hostname.includes('bilibili.com') && urlObj.pathname.includes('/video/')) {
      const bvMatch = urlObj.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/);
      if (bvMatch) {
        return `${urlObj.origin}/video/${bvMatch[1]}`;
      }
    }
    // 其他网页只保留 origin 和 pathname
    return urlObj.origin + urlObj.pathname;
  } catch (e) {
    return url;
  }
}

// 检查URL是否匹配屏蔽列表
function isUrlBlocked(url, patterns) {
  console.log('检查URL是否匹配屏蔽列表');
  console.log('当前URL:', url);
  const cleanUrl = getCleanUrl(url);
  console.log('纯净URL:', cleanUrl);

  return patterns.some(pattern => {
    try {
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        // 正则表达式匹配
        const regex = new RegExp(pattern.slice(1, -1));
        return regex.test(url) || regex.test(cleanUrl);
      } else {
        console.log('进行URL匹配检查');
        console.log('模式:', pattern);
        console.log('待匹配URL:', cleanUrl);
        
        // 获取pattern的纯净URL
        const cleanPattern = getCleanUrl(pattern);
        console.log('纯净模式:', cleanPattern);
        
        // 检查是否匹配
        const isMatched = cleanUrl === cleanPattern;
        console.log('是否匹配:', isMatched);
        
        return isMatched;
      }
    } catch (e) {
      console.error('匹配过程中出错:', e);
      return false;
    }
  });
}

// 显示通知
function showBlockNotification(url) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.jpg',  // 修改为与manifest中相同的图标
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
