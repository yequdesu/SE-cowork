// pages/ranking/ranking.js
const API_BASE_URL = 'https://localhost:3000/api';

Page({
  data: {
    rankings: [],
    loading: false,
    exporting: false,
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
  },

  // 导出积分详单
  exportScores: function() {
    console.log('开始导出积分详单');
    const that = this;
    const selectedCourse = wx.getStorageSync('selectedCourse');
    console.log('获取selectedCourse:', selectedCourse);
    if (!selectedCourse) {
      console.log('未选择课程，显示错误提示并返回');
      wx.showToast({
        title: '请先选择课程',
        icon: 'error'
      });
      return;
    }
    const course_id = selectedCourse.id;
    console.log('课程ID:', course_id);

    console.log('设置exporting状态为true');
    this.setData({
      exporting: true
    });

    console.log('显示loading提示');
    wx.showLoading({
      title: '正在导出...'
    });

    const downloadUrl = `${API_BASE_URL}/exportScores?course_id=${course_id}`;
    console.log('开始下载文件，URL:', downloadUrl);
    wx.downloadFile({
      url: downloadUrl,
      success: function(res) {
        console.log('下载请求成功回调，statusCode:', res.statusCode, 'tempFilePath:', res.tempFilePath);
        that.setData({
          exporting: false
        });
        wx.hideLoading();
        if (res.statusCode === 200) {
          console.log('服务器响应成功，开始打开文件');
          wx.openDocument({
            filePath: res.tempFilePath,
            success: function() {
              console.log('文件打开成功');
              wx.showToast({
                title: '文件已打开',
                icon: 'success'
              });
            },
            fail: function(openErr) {
              console.log('文件打开失败，错误:', openErr);
              wx.showToast({
                title: '打开文件失败：' + openErr.errMsg,
                icon: 'error'
              });
            }
          });
        } else {
          console.log('导出失败，服务器返回statusCode:', res.statusCode, '响应数据:', res.data);
          wx.showToast({
            title: '导出失败：服务器错误',
            icon: 'error'
          });
        }
      },
      fail: function(err) {
        console.log('下载请求失败，错误:', err);
        that.setData({
          exporting: false
        });
        wx.hideLoading();
        wx.showToast({
          title: '网络错误：' + err.errMsg,
          icon: 'error'
        });
      }
    });
  }
});