// pages/course-select/course-select.js
const API_BASE_URL = 'http://localhost:3001/api';

Page({
  data: {
    courses: [],
    selectedCourse: null,
    loading: false,
    creating: false,
    newCourseName: '',
    newCourseDescription: '',
    isDisabled: true,
    message: ''
  },

  onLoad: function() {
    // 初始化页面数据
    this.setData({
      courses: [],
      selectedCourse: null,
      loading: false,
      creating: false,
      newCourseName: '',
      newCourseDescription: '',
      isDisabled: true,
      message: ''
    });
    this.loadCourses();
    this.loadSelectedCourse();
  },

  onShow: function() {
    this.loadCourses();
    this.loadSelectedCourse();
  },

  // 加载课程列表
  loadCourses: function() {
    const that = this;
    this.setData({
      loading: true
    });
    wx.request({
      url: `${API_BASE_URL}/courses`,
      method: 'GET',
      success: function(res) {
        that.setData({
          loading: false
        });
        if (res.statusCode === 200 && res.data.success) {
          that.setData({
            courses: res.data.courses,
            message: '课程列表加载成功'
          });
        } else {
          that.setData({
            message: '加载课程列表失败'
          });
        }
      },
      fail: function(err) {
        that.setData({
          loading: false,
          message: '网络错误：' + err.errMsg
        });
      }
    });
  },

  // 加载选中的课程
  loadSelectedCourse: function() {
    const selectedCourse = wx.getStorageSync('selectedCourse');
    if (selectedCourse) {
      this.setData({
        selectedCourse: selectedCourse
      });
    }
  },

  // 选择课程
  selectCourse: function(e) {
    const courseId = e.currentTarget.dataset.courseId;
    const course = this.data.courses.find(c => c.id === courseId);
    if (course) {
      this.setData({
        selectedCourse: course
      });
      wx.setStorageSync('selectedCourse', course);
      wx.showToast({
        title: '课程已选择',
        icon: 'success'
      });
    }
  },

  // 输入新课程名称
  onCourseNameInput: function(e) {
    this.setData({
      newCourseName: e.detail.value,
      isDisabled: !e.detail.value.trim()
    });
  },

  // 输入新课程描述
  onCourseDescriptionInput: function(e) {
    this.setData({
      newCourseDescription: e.detail.value
    });
  },

  // 删除课程
  deleteCourse: function(e) {
    const courseId = e.currentTarget.dataset.courseId;
    const that = this;

    wx.showModal({
      title: '确认删除',
      content: '删除课程将同时删除该课程下的所有学生和积分数据，此操作不可恢复。确定要删除吗？',
      success: function(res) {
        if (res.confirm) {
          wx.request({
            url: `${API_BASE_URL}/courses/${courseId}`,
            method: 'DELETE',
            success: function(res) {
              if (res.statusCode === 200 && res.data.success) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                that.loadCourses(); // 重新加载课程列表
                // 如果删除的是当前选中的课程，清空选择
                if (that.data.selectedCourse && that.data.selectedCourse.id === courseId) {
                  that.setData({
                    selectedCourse: null
                  });
                  wx.removeStorageSync('selectedCourse');
                }
              } else {
                wx.showToast({
                  title: '删除失败',
                  icon: 'none'
                });
              }
            },
            fail: function(err) {
              wx.showToast({
                title: '网络错误',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 创建新课程
  createCourse: function() {
    if (!this.data.newCourseName.trim()) {
      wx.showToast({
        title: '请输入课程名称',
        icon: 'none'
      });
      return;
    }

    const that = this;
    this.setData({
      creating: true
    });

    wx.request({
      url: `${API_BASE_URL}/courses`,
      method: 'POST',
      data: {
        course_name: this.data.newCourseName.trim(),
        description: this.data.newCourseDescription.trim()
      },
      success: function(res) {
        that.setData({
          creating: false
        });
        if (res.statusCode === 200 && res.data.success) {
          that.setData({
            newCourseName: '',
            newCourseDescription: '',
            isDisabled: true,
            message: '课程创建成功'
          });
          wx.showToast({
            title: '创建成功',
            icon: 'success'
          });
          that.loadCourses(); // 重新加载课程列表
        } else {
          that.setData({
            message: '创建失败：' + (res.data.message || '未知错误')
          });
        }
      },
      fail: function(err) {
        that.setData({
          creating: false,
          message: '网络错误：' + err.errMsg
        });
      }
    });
  }
});