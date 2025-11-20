// pages/roll-call/roll-call.js
const API_BASE_URL = 'http://localhost:3001/api';

Page({
  data: {
    students: [],
    currentStudent: null,
    mode: 'random', // 'random' or 'sequential'
    selectedMode: 'random', // 选中的点名模式
    sequentialIndex: 0,
    loading: false,
    updating: false,
    scoreInput: '',
    message: '',
    arrived: false,
    repeatedQuestion: false,
    score: 0
  },

  onLoad: function() {
    // 初始化所有页面数据字段，避免页面切换时的渲染问题
    this.setData({
      students: [],
      currentStudent: null,
      mode: 'random',
      selectedMode: 'random',
      sequentialIndex: 0,
      loading: false,
      updating: false,
      scoreInput: '',
      message: '',
      arrived: false,
      repeatedQuestion: false,
      score: 0
    });
    this.loadStudents();
  },

  onShow: function() {
    this.loadStudents();
  },

  // 加载学生列表
  loadStudents: function() {
    const that = this;
    this.setData({
      loading: true
    });
    wx.request({
      url: `${API_BASE_URL}/students`,
      method: 'GET',
      success: function(res) {
        that.setData({
          loading: false
        });
        if (res.statusCode === 200 && res.data.success) {
          that.setData({
            students: res.data.students,
            message: '学生列表加载成功'
          });
        } else {
          that.setData({
            message: '加载学生列表失败'
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

  // 切换模式
  switchMode: function(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      mode: mode,
      currentStudent: null,
      sequentialIndex: 0
    });
  },

  // 选择点名模式
  selectMode: function(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      selectedMode: mode
    });
    wx.showToast({
      title: mode === 'random' ? '已选择随机模式' : '已选择顺序模式',
      icon: 'success'
    });
  },

  // 点名
  rollCall: function() {
    if (this.data.students.length === 0) {
      wx.showToast({
        title: '无学生数据',
        icon: 'none'
      });
      return;
    }

    let selectedStudent;
    if (this.data.mode === 'random') {
      const randomIndex = Math.floor(Math.random() * this.data.students.length);
      selectedStudent = this.data.students[randomIndex];
    } else {
      selectedStudent = this.data.students[this.data.sequentialIndex];
      this.setData({
        sequentialIndex: (this.data.sequentialIndex + 1) % this.data.students.length
      });
    }

    this.setData({
      currentStudent: selectedStudent,
      scoreInput: selectedStudent.total_score || 0
    });
  },
  // 执行点名（调用API）
  performRollCall: function() {
    if (this.data.students.length === 0) {
      wx.showToast({
        title: '无学生数据',
        icon: 'none'
      });
      return;
    }

    const that = this;
    this.setData({
      loading: true
    });

    const mode = this.data.selectedMode;
    const url = mode === 'random' ? `${API_BASE_URL}/rollCall/random` : `${API_BASE_URL}/rollCall/sequential`;

    wx.request({
      url: url,
      method: 'GET',
      success: function(res) {
        that.setData({
          loading: false
        });
        if (res.statusCode === 200) {
          // 找到对应的学生信息
          const selectedStudent = that.data.students.find(student => student.student_id.toString() === res.data.student_id.toString());
          if (selectedStudent) {
            that.setData({
              currentStudent: selectedStudent,
              scoreInput: '',
              arrived: false,
              repeatedQuestion: false,
              message: `点名成功：${selectedStudent.name}`
            });
          } else {
            that.setData({
              message: '点名失败：未找到学生信息'
            });
          }
        } else {
          that.setData({
            message: '点名失败：' + (res.data.error || '未知错误')
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

  // 输入积分
  onScoreInput: function(e) {
    this.setData({
      scoreInput: e.detail.value
    });
  },

  // 更新积分
  updateScore: function() {
    if (!this.data.currentStudent) {
      wx.showToast({
        title: '请先点名',
        icon: 'none'
      });
      return;
    }

    const score = parseInt(this.data.scoreInput);
    if (isNaN(score)) {
      wx.showToast({
        title: '请输入有效积分',
        icon: 'none'
      });
      return;
    }

    const that = this;
    this.setData({
      updating: true
    });

    wx.request({
      url: `${API_BASE_URL}/updateRollCall`,
      method: 'POST',
      data: {
        studentId: this.data.currentStudent.student_id,
        score: score
      },
      success: function(res) {
        that.setData({
          updating: false
        });
        if (res.statusCode === 200 && res.data.success) {
          that.setData({
            message: '积分更新成功'
          });
          wx.showToast({
            title: '更新成功',
            icon: 'success'
          });
          // 更新本地数据
          const updatedStudents = that.data.students.map(student => {
            if (student.student_id === that.data.currentStudent.student_id) {
              return { ...student, total_score: score };
            }
            return student;
          });
          that.setData({
            students: updatedStudents,
            currentStudent: { ...that.data.currentStudent, total_score: score }
          });
        } else {
          that.setData({
            message: '更新失败：' + (res.data.message || '未知错误')
          });
        }
      },
      fail: function(err) {
        that.setData({
          updating: false,
          message: '网络错误：' + err.errMsg
        });
      }
    });
  },

  // 到达课堂复选框变化
  onArrivedChange: function(e) {
    this.setData({
      arrived: e.detail.value
    });
  },

  // 重复问题复选框变化
  onRepeatedChange: function(e) {
    this.setData({
      repeatedQuestion: e.detail.value
    });
  },

  // 提交更新
  submitUpdate: function() {
    if (!this.data.currentStudent) {
      wx.showToast({
        title: '请先点名',
        icon: 'none'
      });
      return;
    }

    const score = parseInt(this.data.scoreInput);
    if (isNaN(score)) {
      wx.showToast({
        title: '请输入有效分数',
        icon: 'none'
      });
      return;
    }

    const that = this;
    this.setData({
      updating: true
    });

    wx.request({
      url: `${API_BASE_URL}/updateRollCall`,
      method: 'POST',
      data: {
        studentId: this.data.currentStudent.student_id,
        score: score
      },
      success: function(res) {
        that.setData({
          updating: false
        });
        if (res.statusCode === 200 && res.data.success) {
          that.setData({
            message: '更新成功'
          });
          wx.showToast({
            title: '更新成功',
            icon: 'success'
          });
          // 更新本地数据
          const updatedStudents = that.data.students.map(student => {
            if (student.student_id === that.data.currentStudent.student_id) {
              return { ...student, total_score: score };
            }
            return student;
          });
          that.setData({
            students: updatedStudents,
            currentStudent: { ...that.data.currentStudent, total_score: score }
          });
        } else {
          that.setData({
            message: '更新失败：' + (res.data.message || '未知错误')
          });
        }
      },
      fail: function(err) {
        that.setData({
          updating: false,
          message: '网络错误：' + err.errMsg
        });
      }
    });
  }
});