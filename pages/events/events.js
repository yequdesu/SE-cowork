// pages/events/events.js
Page({
  data: {
    randomEventsEnabled: false
  },

  onLoad: function() {
    // 从本地存储加载随机事件开关状态
    const randomEventsEnabled = wx.getStorageSync('randomEventsEnabled') || false;
    this.setData({
      randomEventsEnabled: randomEventsEnabled
    });
  },

  // 切换随机事件开关
  toggleRandomEvents: function(e) {
    const enabled = e.detail.value;
    this.setData({
      randomEventsEnabled: enabled
    });

    // 保存到本地存储
    wx.setStorageSync('randomEventsEnabled', enabled);

    // 显示提示
    wx.showToast({
      title: enabled ? '随机事件已开启' : '随机事件已关闭',
      icon: 'success'
    });
  }
});