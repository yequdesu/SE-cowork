// pages/import/import.js
const API_BASE_URL = 'https://localhost:3000/api';

Page({
  data: {
    selectedFile: null,
    fileName: '',
    uploading: false,
    message: '',
    progress: 0
  },

  onLoad: function() {
    // 初始化页面数据，避免页面切换时的渲染问题
    this.setData({
      selectedFile: null,
      fileName: '',
      uploading: false,
      message: '',
      progress: 0
    });
  },

  // 选择文件
  chooseFile: function() {
    const that = this;
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: function(res) {
        const file = res.tempFiles[0];
        that.setData({
          selectedFile: file,
          fileName: file.name,
          message: '文件已选择：' + file.name
        });
      },
      fail: function(err) {
        console.error('选择文件失败：', err);
        // 检查是否为用户取消操作
        if (err.errMsg && err.errMsg.includes('cancel')) {
          // 用户取消，不显示错误信息或显示友好提示
          that.setData({
            message: '已取消选择文件'
          });
        } else {
          that.setData({
            message: '选择文件失败'
          });
        }
      }
    });
  },

  // 上传文件方法
  uploadFile: function(successCallback, failCallback, course_id) {
    const that = this;
    const uploadTask = wx.uploadFile({
      url: `${API_BASE_URL}/importStudents`,
      filePath: this.data.selectedFile.path,
      name: 'file',
      formData: {
        course_id: course_id
      },
      success: function(res) {
        if (successCallback) {
          successCallback(res);
        }
      },
      fail: function(err) {
        if (failCallback) {
          failCallback(err);
        }
      }
    });

    // 处理上传进度
    uploadTask.onProgressUpdate((res) => {
      that.setData({
        progress: res.progress
      });
    });

    return uploadTask;
  },

  // 上传并导入
  uploadAndImport: function() {
    const that = this;
    if (!this.data.selectedFile) {
      wx.showToast({
        title: '请先选择文件',
        icon: 'none'
      });
      return;
    }

    const selectedCourse = wx.getStorageSync('selectedCourse');
    if (!selectedCourse) {
      wx.showToast({
        title: '请先选择课程',
        icon: 'none'
      });
      return;
    }
    const course_id = selectedCourse.id;

    this.setData({
      uploading: true,
      message: '正在上传...',
      progress: 0
    });

    this.uploadFile(
      function(res) {
        that.setData({
          uploading: false,
          progress: 100
        });
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data);
          if (data.success) {
            that.setData({
              message: '导入成功！'
            });
            wx.showToast({
              title: '导入成功',
              icon: 'success'
            });
          } else {
            that.setData({
              message: '导入失败：' + data.error
            });
            wx.showToast({
              title: '导入失败',
              icon: 'none'
            });
          }
        } else {
          that.setData({
            message: '上传失败，状态码：' + res.statusCode
          });
        }
      },
      function(err) {
        that.setData({
          uploading: false,
          message: '上传失败：' + err.errMsg
        });
        console.error('上传失败：', err);
      },
      course_id
    );
  }
});