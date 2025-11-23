// pages/roll-call/roll-call.js
const API_BASE_URL = 'https://localhost:3000/api';

Page({
  data: {
    students: [],
    currentStudent: null,
    mode: 'random', // 'random' or 'sequential'
    selectedMode: 'random', // 选中的点名模式
    sequentialIndex: 0,
    loading: false,
    updating: false,
    message: '',
    arrived: false,
    recitationCorrect: null, // null, true, false
    answerScore: '',
    score: 0,
    previewScore: 0, // 积分预览
    combo: 0,
    lastStudent: null,
    randomEvent: null,
    randomEventInfo: null, // 随机事件详细信息
    bonusScore: 0,
    multiplier: 1, // 事件倍率
    comboMultiplier: 1, // combo倍率
    totalMultiplier: 1, // 总倍率
    luckyStudent: null, // 幸运加倍指定的学生
    randomEventsEnabled: false // 随机事件开关状态
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
      message: '',
      arrived: false,
      recitationCorrect: null,
      answerScore: '',
      score: 0,
      previewScore: 0,
      combo: 0,
      lastStudent: null,
      randomEvent: null,
      randomEventInfo: null,
      bonusScore: 0,
      multiplier: 1,
      comboMultiplier: 1,
      totalMultiplier: 1,
      luckyStudent: null,
      randomEventsEnabled: wx.getStorageSync('randomEventsEnabled') || false
    });
    this.loadStudents();
  },

  onShow: function() {
    this.loadStudents();
  },

  // 加载学生列表
  loadStudents: function() {
    console.log('[DEBUG] loadStudents: 开始加载学生列表');
    const that = this;
    const selectedCourse = wx.getStorageSync('selectedCourse');
    if (!selectedCourse) {
      console.log('[DEBUG] loadStudents: 未选择课程');
      wx.showToast({
        title: '请先选择课程',
        icon: 'error'
      });
      return;
    }
    const course_id = selectedCourse.id;
    console.log('[DEBUG] loadStudents: 课程ID:', course_id);
    this.setData({
      loading: true
    });
    wx.request({
      url: `${API_BASE_URL}/students?course_id=${course_id}`,
      method: 'GET',
      success: function(res) {
        console.log('[DEBUG] loadStudents: API响应状态码:', res.statusCode);
        console.log('[DEBUG] loadStudents: API响应数据:', res.data);
        that.setData({
          loading: false
        });
        if (res.statusCode === 200 && res.data.success) {
          console.log('[DEBUG] loadStudents: 学生列表加载成功，学生数量:', res.data.students.length);
          that.setData({
            students: res.data.students,
            message: '学生列表加载成功'
          });
        } else {
          console.log('[DEBUG] loadStudents: 加载学生列表失败，响应:', res.data);
          that.setData({
            message: '加载学生列表失败'
          });
        }
      },
      fail: function(err) {
        console.log('[DEBUG] loadStudents: 网络错误:', err.errMsg);
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

  // 跳转到事件管理页面
  goToEvents: function() {
    wx.navigateTo({
      url: '/pages/events/events'
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
    console.log('[DEBUG] performRollCall: 开始执行点名');
    if (this.data.students.length === 0) {
      console.log('[DEBUG] performRollCall: 无学生数据');
      wx.showToast({
        title: '无学生数据',
        icon: 'none'
      });
      return;
    }

    const that = this;
    const selectedCourse = wx.getStorageSync('selectedCourse');
    if (!selectedCourse) {
      console.log('[DEBUG] performRollCall: 未选择课程');
      wx.showToast({
        title: '请先选择课程',
        icon: 'error'
      });
      return;
    }
    const course_id = selectedCourse.id;
    console.log('[DEBUG] performRollCall: 课程ID:', course_id, '模式:', this.data.selectedMode);
    this.setData({
      loading: true
    });

    const mode = this.data.selectedMode;
    const url = mode === 'random' ? `${API_BASE_URL}/rollCall/random?course_id=${course_id}` : `${API_BASE_URL}/rollCall/sequential?course_id=${course_id}`;
    console.log('[DEBUG] performRollCall: 请求URL:', url);

    // 只有随机模式才发送随机事件开关参数
    const randomEventsEnabled = wx.getStorageSync('randomEventsEnabled') || false;
    const requestData = mode === 'random' ? { randomEventEnabled: randomEventsEnabled ? 'true' : 'false' } : {};

    wx.request({
      url: url,
      method: 'GET',
      data: requestData,
      success: function(res) {
        console.log('[DEBUG] performRollCall: API响应状态码:', res.statusCode);
        console.log('[DEBUG] performRollCall: API响应数据:', res.data);
        that.setData({
          loading: false
        });
        if (res.statusCode === 200) {
          // 找到对应的学生信息
          let selectedStudent = that.data.students.find(student => student.student_id.toString() === res.data.student_id.toString());
          console.log('[DEBUG] performRollCall: 找到的学生:', selectedStudent);

          // 检查幸运加倍
          if (that.data.luckyStudent) {
            selectedStudent = that.data.luckyStudent;
            console.log('[DEBUG] performRollCall: 触发幸运加倍，强制选择学生:', selectedStudent.name);
            that.setData({
              luckyStudent: null // 重置幸运加倍状态
            });
          }

          if (selectedStudent) {
            console.log('[DEBUG] performRollCall: 点名成功，学生:', selectedStudent.name);
            // 检查combo逻辑
            let newCombo = 0;
            if (that.data.selectedMode === 'random' && that.data.lastStudent && that.data.lastStudent.student_id === selectedStudent.student_id) {
              newCombo = that.data.combo + 1;
            }

            // 从后端响应获取随机事件信息
            let randomEvent = res.data.randomEvent || null;
            let randomEventInfo = res.data.randomEventInfo || null;
            let bonusScore = res.data.bonusScore || 0;
            let multiplier = res.data.multiplier || 1;

            // 获取随机事件详细信息（如果后端没有提供）
            if (randomEvent && !randomEventInfo) {
              randomEventInfo = that.getRandomEventInfo(randomEvent);
            }

            // 检查幸运加倍
            if (res.data.luckyStudent) {
              that.setData({
                luckyStudent: selectedStudent
              });
            }

            // 计算combo倍率
            let comboMultiplier = 1;
            if (newCombo > 0) {
              comboMultiplier = newCombo + 1;
            }

            // 计算总倍率
            let totalMultiplier;
            if (comboMultiplier > 1 && multiplier > 1) {
              totalMultiplier = comboMultiplier + multiplier;
            } else if (comboMultiplier > 1) {
              totalMultiplier = comboMultiplier;
            } else if (multiplier > 1) {
              totalMultiplier = multiplier;
            } else {
              totalMultiplier = 1;
            }

            that.setData({
              currentStudent: selectedStudent,
              arrived: false,
              recitationCorrect: null,
              answerScore: '',
              previewScore: 0,
              combo: newCombo,
              lastStudent: selectedStudent,
              multiplier: multiplier,
              comboMultiplier: comboMultiplier,
              totalMultiplier: totalMultiplier,
              randomEvent: randomEvent,
              randomEventInfo: randomEventInfo,
              bonusScore: bonusScore,
              message: `点名成功：${selectedStudent.name}`
            });
          } else {
            console.log('[DEBUG] performRollCall: 未找到学生信息');
            that.setData({
              message: '点名失败：未找到学生信息'
            });
          }
        } else {
          console.log('[DEBUG] performRollCall: 点名失败，错误:', res.data.error);
          that.setData({
            message: '点名失败：' + (res.data.error || '未知错误')
          });
        }
      },
      fail: function(err) {
        console.log('[DEBUG] performRollCall: 网络错误:', err.errMsg);
        that.setData({
          loading: false,
          message: '网络错误：' + err.errMsg
        });
      }
    });
  },

  // 切换到达状态
  toggleArrived: function() {
    this.setData({
      arrived: !this.data.arrived
    });
    this.updatePreviewScore();
  },

  // 设置复述问题正确性
  setRecitationCorrect: function(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      recitationCorrect: value
    });
    this.updatePreviewScore();
  },

  // 输入回答分数
  onAnswerScoreInput: function(e) {
    this.setData({
      answerScore: e.detail.value
    });
    this.updatePreviewScore();
  },

  // 更新积分预览
  updatePreviewScore: function() {
    const arrivedScore = this.data.arrived ? 1 : 0;
    let recitationScore = this.data.recitationCorrect === true ? 0.5 : this.data.recitationCorrect === false ? -1 : 0;
    // 免扣分效果：复述错误且触发免扣分时，扣分设为0
    if (this.data.recitationCorrect === false && this.data.randomEvent === '免扣分') {
      recitationScore = 0;
    }
    const answerScore = parseFloat(this.data.answerScore) || 0;
    let comboMultiplier = 1;
    if (this.data.combo > 0 && this.data.arrived && this.data.recitationCorrect === true) {
      comboMultiplier = this.data.combo + 1;
    }
    const eventMultiplier = this.data.multiplier;
    let totalMultiplier;
    if (comboMultiplier > 1 && eventMultiplier > 1) {
      totalMultiplier = comboMultiplier + eventMultiplier;
    } else if (comboMultiplier > 1) {
      totalMultiplier = comboMultiplier;
    } else if (eventMultiplier > 1) {
      totalMultiplier = eventMultiplier;
    } else {
      totalMultiplier = 1;
    }
    const bonusScore = this.data.bonusScore || 0;
    const totalPreview = arrivedScore + recitationScore + (answerScore * totalMultiplier) + bonusScore;
    this.setData({
      previewScore: totalPreview,
      comboMultiplier: comboMultiplier,
      totalMultiplier: totalMultiplier
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

    // 计算积分
    const arrivedScore = this.data.arrived ? 1 : 0;
    let recitationScore = this.data.recitationCorrect === true ? 0.5 : this.data.recitationCorrect === false ? -1 : 0;
    // 免扣分效果：复述错误且触发免扣分时，扣分设为0
    if (this.data.recitationCorrect === false && this.data.randomEvent === '免扣分') {
      recitationScore = 0;
    }
    const answerScore = parseFloat(this.data.answerScore) || 0;

    // 验证回答分数范围
    if (answerScore < 0.5 || answerScore > 3) {
      wx.showToast({
        title: '回答分数必须在0.5-3分之间',
        icon: 'none'
      });
      return;
    }

    let comboMultiplier = 1;
    if (this.data.combo > 0 && this.data.arrived && this.data.recitationCorrect === true) {
      comboMultiplier = this.data.combo + 1;
    }
    const eventMultiplier = this.data.multiplier;
    let totalMultiplier;
    if (comboMultiplier > 1 && eventMultiplier > 1) {
      totalMultiplier = comboMultiplier + eventMultiplier;
    } else if (comboMultiplier > 1) {
      totalMultiplier = comboMultiplier;
    } else if (eventMultiplier > 1) {
      totalMultiplier = eventMultiplier;
    } else {
      totalMultiplier = 1;
    }
    const bonusScore = this.data.bonusScore || 0;
    const totalScore = arrivedScore + recitationScore + (answerScore * totalMultiplier) + bonusScore;

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
      updating: true
    });

    wx.request({
      url: `${API_BASE_URL}/updateRollCall`,
      method: 'POST',
      data: {
        studentId: this.data.currentStudent.student_id,
        arrived: this.data.arrived,
        recitationCorrect: this.data.recitationCorrect,
        answerScore: answerScore,
        totalScore: totalScore,
        course_id: course_id,
        combo: this.data.combo,
        randomEvent: this.data.randomEvent,
        bonusScore: bonusScore
      },
      success: function(res) {
        that.setData({
          updating: false
        });
        if (res.statusCode === 200 && res.data.success) {
          let message = '更新成功';
          if (res.data.randomEvent) {
            message += ` | 随机事件: ${res.data.randomEvent}`;
            wx.showToast({
              title: `更新成功！`,
              icon: 'success',
              duration: 2000
            });
          } else {
            wx.showToast({
              title: '更新成功！',
              icon: 'success'
            });
          }
          that.setData({
            message: message,
            randomEvent: res.data.randomEvent || null,
            randomEventInfo: res.data.randomEventInfo || null,
            bonusScore: res.data.bonusScore || 0
          });
          // 更新本地数据
          const updatedTotalScore = res.data.totalScore || totalScore;
          const updatedStudents = that.data.students.map(student => {
            if (student.student_id === that.data.currentStudent.student_id) {
              return { ...student, total_score: updatedTotalScore };
            }
            return student;
          });
          that.setData({
            students: updatedStudents,
            currentStudent: { ...that.data.currentStudent, total_score: updatedTotalScore }
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

  // 获取随机事件详细信息
  getRandomEventInfo: function(eventName) {
    const events = {
      '免扣分': {
        name: '免扣分',
        description: '本次点名免除所有扣分，获得基础分数',
        icon: '🛡️',
        bonusScore: 0,
        multiplier: 1
      },
      '额外加分': {
        name: '额外加分',
        description: '本次点名额外获得1分奖励',
        icon: '⭐',
        bonusScore: 1,
        multiplier: 1
      },
      '幸运加倍': {
        name: '幸运加倍',
        description: '本次评分分数*2',
        icon: '🎯',
        bonusScore: 0,
        multiplier: 2
      }
    };
    return events[eventName] || null;
  },

  // 触发随机事件
  triggerRandomEvent: function() {
    const random = Math.random() * 100; // 0-100的随机数

    if (random < 20) {
      // 20%概率：免扣分
      return {
        event: '免扣分',
        bonusScore: 0,
        multiplier: 1,
        luckyStudent: false
      };
    } else if (random < 50) {
      // 30%概率：额外加分
      return {
        event: '额外加分',
        bonusScore: 1,
        multiplier: 1,
        luckyStudent: false
      };
    } else if (random < 60) {
      // 10%概率：幸运加倍
      return {
        event: '幸运加倍',
        bonusScore: 0,
        multiplier: 2,
        luckyStudent: false
      };
    } else {
      // 40%概率：无事件
      return {
        event: null,
        bonusScore: 0,
        multiplier: 1,
        luckyStudent: false
      };
    }
  }
});