<template>
  <div class="container">
    <h1 class="title">Linux课程作业成绩查询系统</h1>
    <div class="search-box">
      <el-input
          v-model="studentId"
          placeholder="请输入学号"
          class="search-input"
          @keyup.enter.native="handleSearch"
          clearable
      />
      <el-button
          type="primary"
          class="search-btn"
          @click="handleSearch"
          :loading="loading"
      >
        查询
      </el-button>
    </div>

    <el-card v-if="result" class="result-card">
      <template #header>
        <div class="card-header">
          <span>查询结果（学号：{{ formattedStudentId }}）</span>
        </div>
      </template>

      <el-table
          :data="tableData"
          stripe
          class="data-table"
          max-height="600"
          v-loading="loading"
      >
        <el-table-column
            prop="category"
            label="项目"
            width="220"
            fixed
        />
        <el-table-column
            prop="value"
            label="值"
            :formatter="formatValue"
        />
      </el-table>

      <!-- 新增评分标准 -->
      <div class="scoring-criteria">
        <h4>作业评分标准：</h4>
        <ul>
          <li><span class="criteria-item">每个小题：</span>共5分</li>
          <li><span class="criteria-item">权限问题/缺sudo：</span>扣2分</li>
          <li><span class="criteria-item">AI抄袭嫌疑：</span>扣3分</li>
          <li><span class="criteria-item">多命令不完整：</span>扣3分</li>
          <li><span class="criteria-item">参数/路径错误：</span>扣2-3分</li>
          <li><span class="criteria-item">大小写错误：</span>扣2-3分</li>
          <li><span class="criteria-item">无法实现预期功能：</span>不得分</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import Papa from 'papaparse'

const formatStudentId = (id) => {
  return String(id).replace(/[^\d]/g, '')
}

const studentId = ref('')
const tableData = ref([])
const loading = ref(false)
const result = ref(false)

const formattedStudentId = computed(() => {
  return studentId.value.replace(/[^\d]/g, '')
})

const getCSVPath = () => {
  return import.meta.env.DEV
      ? '/scores.csv'
      : `${window.location.origin}/scores.csv`
}

const parseCSV = async () => {
  try {
    const response = await fetch(getCSVPath(), {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })

    if (!response.ok) {
      throw new Error(`CSV加载失败: ${response.status}`)
    }

    const text = await response.text()

    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        complete: (result) => {
          if (result.errors.length > 0) {
            reject(new Error('CSV格式错误'))
          } else {
            resolve(result.data)
          }
        },
        skipEmptyLines: true
      })
    })
  } catch (error) {
    throw new Error(`数据加载失败: ${error.message}`)
  }
}

const handleSearch = async () => {
  if (!studentId.value.trim()) {
    ElMessage.warning('请输入有效的学号')
    return
  }

  const loadingInstance = ElLoading.service({
    lock: true,
    text: '数据加载中...'
  })

  try {
    loading.value = true
    const csvData = await parseCSV()

    if (!Array.isArray(csvData) || csvData.length < 3) {
      throw new Error('CSV文件格式不正确')
    }

    const studentIds = csvData[2].slice(1).map(id => formatStudentId(id))
    const targetId = formatStudentId(studentId.value)
    const columnIndex = studentIds.indexOf(targetId) + 1

    if (columnIndex === 0) {
      ElMessage.error('未找到该学号的记录')
      result.value = false
      return
    }

    tableData.value = csvData
        .map((row, index) => ({
          category: row?.[0] || `项目${index + 1}`,
          value: row?.[columnIndex] ?? '无记录'
        }))
        .filter(item => item.category && item.value !== undefined)

    result.value = true
  } catch (error) {
    console.error('Error:', error)
    ElMessage.error(error.message.replace('数据加载失败: ', ''))
    result.value = false
  } finally {
    loading.value = false
    loadingInstance.close()
  }
}

const formatValue = (row, column, cellValue) => {
  const integerFields = ['提交序号', '学号', 'QQ']

  if (integerFields.includes(row.category)) {
    const num = parseInt(cellValue)
    return isNaN(num) ? cellValue : num.toString()
  }

  const numericValue = parseFloat(cellValue)
  if (isNaN(numericValue)) return cellValue

  return numericValue % 1 === 0
      ? numericValue.toFixed(0)
      : numericValue.toFixed(2)
}
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 20px;
}

.title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  letter-spacing: 2px;
}

.search-box {
  display: flex;
  gap: 15px;
  margin-bottom: 2rem;
  align-items: center;
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.search-btn {
  padding: 12px 30px;
  font-size: 1.1rem;
}

.result-card {
  margin-top: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  font-size: 1.2rem;
  font-weight: 600;
  color: #409eff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.data-table {
  margin-top: 15px;
}

.scoring-criteria {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.scoring-criteria h4 {
  color: #606266;
  margin-bottom: 12px;
  font-size: 15px;
}

.scoring-criteria ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.scoring-criteria li {
  margin-bottom: 8px;
  font-size: 14px;
  color: #909399;
  display: flex;
  align-items: baseline;
}

.criteria-item {
  color: #303133;
  min-width: 120px;
  font-weight: 500;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  font-weight: 600;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa !important;
}

:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.9);
}
</style>
