<script setup lang="ts">
import { defineEmits, onMounted, reactive, ref } from 'vue';
import type { DataTableColumns, DataTableRowKey, PaginationProps } from 'naive-ui';
import { NDataTable } from 'naive-ui';
import { deviceList } from '@/service/api/device';
import { createOtaDeviceColumns } from '@/views/device/modules/all-columns';
import { $t } from '@/locales';

// eslint-disable-next-line vue/define-emits-declaration
const emit = defineEmits(['closed_modal', 'submit_data']);
const props = defineProps({
  dev_config_id: {
    type: String,
    required: true
  }
});

const data = ref<DeviceManagement.DeviceData[]>([]);
const checkedRowKeysRef = ref<DataTableRowKey[]>([]);

const queryParams = reactive<{ page: number; page_size: number; device_config_id: string }>({
  page: 1,
  page_size: 10,
  device_config_id: props.dev_config_id
});

const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 10,
  onChange: (page: number) => {
    pagination.page = page;
    queryParams.page = page;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getDeviceList();
  }
});

const getDeviceList = async () => {
  const res = await deviceList(queryParams);
  data.value = res.data?.list as DeviceManagement.DeviceData[];
  if (res?.data?.total) {
    pagination.pageCount = Math.ceil(res?.data?.total / 10);
  }
};

const rowKey = (row: DeviceManagement.DeviceData) => row.id;

const deviceColumns: DataTableColumns<DeviceManagement.DeviceData> = createOtaDeviceColumns();

function handleCheck(rowKeys: DataTableRowKey[]) {
  checkedRowKeysRef.value = rowKeys;
}

// 定义 emit 函数，指定可能发出的事件类型

const closeModal = () => {
  // eslint-disable-next-line vue/custom-event-name-casing
  emit('closed_modal', false);
};

const submit_data = async () => {
  emit('submit_data', checkedRowKeysRef.value as string[]); // 将 params 传递给父组件
  closeModal();
};
onMounted(getDeviceList);
</script>

<template>
  <NDataTable
    size="small"
    :columns="deviceColumns"
    :data="data"
    :row-key="rowKey"
    class="h-auto"
    @update:checked-row-keys="handleCheck"
  />
  <NFlex justify="end" class="mt-4">
    <NPagination
      v-model:page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :page-count="pagination.pageCount"
      @update:page="pagination.onChange"
    />
  </NFlex>
  <NFlex justify="end" class="mt-5" align="center">
    <NFlex align="center">
      <div class="text-16px">
        {{ $t('generate.selected') }}
        <span class="text-blue-4">{{ checkedRowKeysRef.length }}</span>
        {{ $t('generate.number-of-devices') }}
      </div>
      <NButton @click="closeModal">{{ $t('custom.grouping_details.cancel') }}</NButton>
      <NButton type="primary" @click="submit_data">{{ $t('custom.grouping_details.confirm') }}</NButton>
    </NFlex>
  </NFlex>
</template>

<style scoped></style>
