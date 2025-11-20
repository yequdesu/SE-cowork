// pages/settings/settings.js
Page({
  data: {
    students: [],
    loading: false,
    showModal: false,
    isEditing: false,
    selectAll: false,
    isMultiSelectMode: false,
    selectedStudents: [],
    currentStudent: {
      student_id: '',
      name: '',
      major: ''
    }
  },

  onLoad: function() {
    this.loadStudents();
  },

  onShow: function() {
    this.loadStudents();
  },

  // 加载学生列表
  loadStudents: function() {
    this.setData({ loading: true });
    wx.request({
      url: 'http://localhost:3001/api/students',
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          this.setData({
            students: res.data.students.map(student => ({
              ...student,
              student_id: String(student.student_id)
            })),
            loading: false
          });
        } else {
          wx.showToast({
            title: '加载失败',
            icon: 'error'
          });
          this.setData({ loading: false });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        });
        this.setData({ loading: false });
      }
    });
  },

  // 显示添加学生模态框
  showAddModal: function() {
    this.setData({
      showModal: true,
      isEditing: false,
      currentStudent: {
        student_id: '',
        name: '',
        major: ''
      }
    });
  },

  // 编辑学生
  editStudent: function(e) {
    const student = e.currentTarget.dataset.student;
    this.setData({
      showModal: true,
      isEditing: true,
      currentStudent: {
        student_id: student.student_id,
        name: student.name,
        major: student.major
      }
    });
  },

  // 隐藏模态框
  hideModal: function() {
    this.setData({
      showModal: false,
      currentStudent: {
        student_id: '',
        name: '',
        major: ''
      }
    });
  },

  // 阻止事件冒泡
  stopPropagation: function() {
    // 阻止事件冒泡
  },

  // 输入处理
  onStudentIdInput: function(e) {
    this.setData({
      'currentStudent.student_id': e.detail.value
    });
  },

  onNameInput: function(e) {
    this.setData({
      'currentStudent.name': e.detail.value
    });
  },

  onMajorInput: function(e) {
    this.setData({
      'currentStudent.major': e.detail.value
    });
  },

  // 保存学生（添加或编辑）
  saveStudent: function() {
    const { currentStudent, isEditing } = this.data;

    // 验证输入
    if (!currentStudent.student_id || !currentStudent.name || !currentStudent.major) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'error'
      });
      return;
    }

    const url = isEditing
      ? `http://localhost:3001/api/students/${currentStudent.student_id}`
      : 'http://localhost:3001/api/students';
    const method = isEditing ? 'PUT' : 'POST';

    wx.request({
      url: url,
      method: method,
      data: currentStudent,
      success: (res) => {
        if (res.data.success) {
          wx.showToast({
            title: isEditing ? '修改成功' : '添加成功',
            icon: 'success'
          });
          this.hideModal();
          this.loadStudents();
        } else {
          wx.showToast({
            title: res.data.message || '操作失败',
            icon: 'error'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        });
      }
    });
  },

  // 删除学生
  deleteStudent: function(e) {
    const studentId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个学生吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `http://localhost:3001/api/students/${studentId}`,
            method: 'DELETE',
            success: (res) => {
              if (res.data.success) {
                // 从selectedStudents中移除已删除的学生ID
                let selectedStudents = this.data.selectedStudents.slice();
                const index = selectedStudents.indexOf(studentId);
                if (index > -1) {
                  selectedStudents.splice(index, 1);
                }
                this.setData({ selectedStudents });
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                this.loadStudents();
              } else {
                wx.showToast({
                  title: '删除失败',
                  icon: 'error'
                });
              }
            },
            fail: () => {
              wx.showToast({
                title: '网络错误',
                icon: 'error'
              });
            }
          });
        }
      }
    });
  },

  // 切换多选模式
  toggleMultiSelectMode: function() {
    const isMultiSelectMode = !this.data.isMultiSelectMode;
    this.setData({
      isMultiSelectMode,
      selectedStudents: [],
      selectAll: false
    });
  },

  // 选择/取消选择学生
  toggleStudentSelection: function(e) {
    const studentId = e.currentTarget.dataset.id;
    let selectedStudents = this.data.selectedStudents.slice();
    const index = selectedStudents.indexOf(studentId);
    if (index > -1) {
      selectedStudents.splice(index, 1);
    } else {
      selectedStudents.push(studentId);
    }
    const selectAll = selectedStudents.length === this.data.students.length;
    this.setData({ selectedStudents, selectAll });
  },

  // 批量删除
  batchDelete: function() {
    if (this.data.selectedStudents.length === 0) {
      wx.showToast({
        title: '请选择学生',
        icon: 'error'
      });
      return;
    }
    wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的 ${this.data.selectedStudents.length} 位学生吗？`,
      success: (res) => {
        if (res.confirm) {
          const promises = this.data.selectedStudents.map(id =>
            new Promise((resolve, reject) => {
              wx.request({
                url: `http://localhost:3001/api/students/${id}`,
                method: 'DELETE',
                success: resolve,
                fail: reject
              });
            })
          );
          Promise.all(promises).then(() => {
            wx.showToast({
              title: '批量删除成功',
              icon: 'success'
            });
            this.loadStudents();
            this.setData({
              selectedStudents: [],
              selectAll: false
            });
          }).catch(() => {
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            });
          });
        }
      }
    });
  },

  // 全选切换（仅在多选模式下）
  toggleSelectAll: function() {
    if (!this.data.isMultiSelectMode) return;
    const selectAll = !this.data.selectAll;
    const selectedStudents = selectAll ? this.data.students.map(s => s.student_id) : [];
    this.setData({ selectAll, selectedStudents });
  }
});