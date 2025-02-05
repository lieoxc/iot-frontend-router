<script lang="ts">
import type { DataTableColumns, DataTableRowKey } from 'naive-ui'
import { defineComponent, ref } from 'vue'

interface RowData {
  key: number
  name: string
  age: string
  address: string
}

const batchSelectModalVisible = ref(false);

function closeBatchSelectModal() {
  batchSelectModalVisible.value = false;
}

function confirmSelection() {
  closeBatchSelectModal();
}

function createColumns(): DataTableColumns<RowData> {
  return [
    {
      type: 'selection',
      disabled(row: RowData) {
        return row.name === 'Edward King 3'
      }
    },
    {
      title: 'Name',
      key: 'name'
    },
    {
      title: 'Age',
      key: 'age'
    },
    {
      title: 'Address',
      key: 'address'
    }
  ]
}

const data = Array.from({ length: 46 }).map((_, index) => ({
  name: `Edward King ${index}`,
  age: 32,
  address: `London, Park Lane no. ${index}`
}))

export default defineComponent({
  setup() {
    const checkedRowKeysRef = ref<DataTableRowKey[]>([])

    return {
      data,
      columns: createColumns(),
      checkedRowKeys: checkedRowKeysRef,
      pagination: {
        pageSize: 5
      },
      rowKey: (row: RowData) => row.address,
      handleCheck(rowKeys: DataTableRowKey[]) {
        checkedRowKeysRef.value = rowKeys
      }
    }
  }
})
</script>

<template>
  <NModal v-model:show="batchSelectModalVisible" preset="card" :title="$t('page.product.update-ota.batchSelectDevice')" class="w-700px">
    <n-data-table
    :columns="columns"
    :data="data"
    :pagination="pagination"
    :row-key="rowKey"
    @update:checked-row-keys="handleCheck"
  />
    <NSpace class="w-full pt-16px" :size="24" justify="end">
      <NButton class="w-72px" @click="closeBatchSelectModal">{{ $t('common.cancel') }}</NButton>
      <NButton class="w-72px" type="primary" @click="confirmSelection">{{ $t('common.confirm') }}</NButton>
    </NSpace>
  </NModal>
</template>
