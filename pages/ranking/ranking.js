// pages/ranking/ranking.js
const API_BASE_URL = 'http://localhost:3001/api';

Page({
  data: {
    rankings: [],
    loading: false,
    message: ''
  },

  onLoad: function() {
    this.loadRankings();
  },

  onShow: function() {
    this.loadRankings();
  },

  // 加载排名数据
  loadRankings: function() {
    const that = this;
    const selectedCourse = wx.getStorageSync('selectedCourse');
    if (!selectedCourse) {
      wx.showToast({
        title: '请先选择课程',
        icon: 'error'
      });
      return;
    }
    const course_id = selectedCourse.id;
    this.setData({
      loading: true
    });
    wx.request({
      url: `${API_BASE_URL}/scores?course_id=${course_id}`,
      method: 'GET',
      success: function(res) {
        that.setData({
          loading: false
        });
        if (res.statusCode === 200 && res.data.success) {
          that.setData({
            rankings: res.data.data || [],
            message: '排名数据加载成功'
          });
          that.drawChart();
        } else {
          that.setData({
            rankings: [],
            message: '加载排名数据失败'
          });
        }
      },
      fail: function(err) {
        that.setData({
          loading: false,
          rankings: [],
          message: '网络错误：' + err.errMsg
        });
      }
    });
  },

  // 绘制柱形图
  drawChart: function() {
    if (this.data.rankings.length === 0) return;

    const ctx = wx.createCanvasContext('rankingChart', this);
    const canvasWidth = 300;
    const canvasHeight = 200;
    const barWidth = 20;
    const maxScore = Math.max(...this.data.rankings.map(r => r.score));

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    this.data.rankings.forEach((ranking, index) => {
      const x = 50 + index * 50;
      const barHeight = (ranking.score / maxScore) * 150;
      const y = canvasHeight - barHeight - 20;

      // 绘制柱子
      ctx.fillStyle = '#007bff';
      ctx.fillRect(x, y, barWidth, barHeight);

      // 绘制标签
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.fillText(ranking.name, x, canvasHeight - 5);
      ctx.fillText(ranking.score, x, y - 5);
    });

    ctx.draw();
  },

  // 刷新数据
  refresh: function() {
    this.loadRankings();
  },

  // 刷新数据方法
  refreshData: function() {
    this.loadRankings();
  }
});