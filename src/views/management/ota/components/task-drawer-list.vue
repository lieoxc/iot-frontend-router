<script setup lang="tsx">
import { defineEmits, defineProps, onUpdated, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { NButton, NPopconfirm, NSpace } from 'naive-ui';
import dayjs from 'dayjs';
import { useBoolean, useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { delUpgradeTask, fetchUpgradeTaskList } from '@/service/api/product';
import TableActionModal from './task-add-modal.vue';
import DeviceDetailModal from './task-detail-modal.vue';
import type { ModalType } from './task-add-modal.vue';
const { startLoading, endLoading } = useLoading(false);
const { bool: showModal, setTrue: openModal } = useBoolean();

const showEmpty = ref(false);
const tableData = ref<Api.UpgradeTask.Task[]>([]);

const taskDetailVisible = ref(false); // 控制任务详情抽屉的显示
const taskDetailTitle = ref(''); // 任务详情标题
const ota_upgrade_task_id = ref(''); // 任务id
defineOptions({ name: 'TableActionDrawer' });

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  ota_upgrade_package_id: {
    type: String,
    required: true
  },
  dev_config_id: {
    type: String,
    required: true
  }
});

type QueryFormModel = Pick<Api.UpgradeTask.Task, 'ota_upgrade_package_id'> & {
  page: number;
  page_size: number;
};

const queryParams = reactive<QueryFormModel>({
  ota_upgrade_package_id: props.ota_upgrade_package_id,
  page: 1,
  page_size: 10
});

const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  itemCount: 0,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page;
    queryParams.page = page;
    getTableData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    queryParams.page = 1;
    queryParams.page_size = pageSize;
    getTableData();
  }
});

const emits = defineEmits(['update:visible', 'success']);

async function getTableData() {
  startLoading();
  queryParams.ota_upgrade_package_id = props.ota_upgrade_package_id;
  const { data } = await fetchUpgradeTaskList(queryParams);
  if (data) {
    const list: Api.UpgradeTask.Task[] = data.list;
    pagination.itemCount = data.total;
    setTableData(list);
  }
  endLoading();
}

function setTableData(data: Api.UpgradeTask.Task[]) {
  if (data === null) {
    showEmpty.value = true;
  } else {
    showEmpty.value = false;
    tableData.value = data;
  }
}

async function handleDeleteTask(rowId: string) {
  const data = await delUpgradeTask(rowId);
  if (!data.error) {
    window.$message?.success($t('common.deleteSuccess'));
    getTableData();
  }
}

const columns: Ref<DataTableColumns<Api.UpgradeTask.Task>> = ref([
  {
    key: 'name',
    minWidth: '140px',
    title: () => $t('page.product.update-ota.taskName'),
    align: 'left'
  },
  {
    key: 'device_count',
    minWidth: '140px',
    title: () => $t('page.product.update-ota.deviceNum'),
    align: 'left'
  },
  {
    key: 'created_at',
    minWidth: '140px',
    title: () => $t('common.creationTime'),
    align: 'left',
    render: row => dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    key: 'description',
    minWidth: '140px',
    title: () => $t('page.product.update-ota.desc'),
    align: 'left'
  },
  {
    key: 'actions',
    width: '300px',
    title: () => $t('common.actions'),
    align: 'left',
    render: row => {
      return (
        <NSpace justify={'start'}>
          <NButton type="primary" size={'small'} onClick={() => handleTaskDetail(row.id)}>
            {$t('page.product.update-ota.taskDetail')}
          </NButton>
          <NPopconfirm
            negative-text={$t('common.cancel')}
            positive-text={$t('common.confirm')}
            onPositiveClick={() => handleDeleteTask(row.id)}
          >
            {{
              default: () => $t('common.confirm'),
              trigger: () => (
                <NButton type="error" size={'small'}>
                  {$t('common.delete')}
                </NButton>
              )
            }}
          </NPopconfirm>
        </NSpace>
      );
    }
  }
]) as Ref<DataTableColumns<Api.UpgradeTask.Task>>;

function closeTaskDetailDrawer() {
  taskDetailVisible.value = false; // 关闭任务详情抽屉
}

async function handleTaskDetail(rowId: string) {
  startLoading();
  const findItem = tableData.value.find(item => item.id === rowId);
  if (findItem) {
    console.log('handleTaskDetail rowId:', rowId);
    taskDetailVisible.value = true; // 显示任务详情抽屉
    ota_upgrade_task_id.value = rowId;
    taskDetailTitle.value = $t('page.product.update-ota.taskDetail');
  }
  endLoading();
}

function handleAddtask() {
  openModal();
  setModalType('add');
}

// 当 ota_upgrade_package_id 改变时，重新加载数据
onUpdated(() => {
  getTableData();
});
</script>

<template>
  <NDrawer
    :show="visible"
    placement="right"
    :width="1500"
    native-scrollbar
    @update:show="value => emits('update:visible', value)"
  >
    <NDrawerContent :title="title">
      <!-- 操作按钮 -->
      <div class="drawer-header">
        <NSpace justify="space-between" align="center" class="mb-4">
          <div>
            <NButton type="primary" size="small" @click="handleAddtask">
              {{ $t('page.product.update-ota.updateTask') }}
            </NButton>
          </div>
        </NSpace>
      </div>

      <!-- 表格 -->
      <NDataTable
        v-if="tableData.length > 0"
        :columns="columns"
        :data="tableData"
        :bordered="false"
        :pagination="pagination"
      />
      <div v-else class="empty-state">
        <NEmpty description="无数据" />
      </div>
      <TableActionModal
        v-model:showModal="showModal"
        :type="modalType"
        :dev_config_id="props.dev_config_id"
        :ota_upgrade_package_id="props.ota_upgrade_package_id"
        @success="getTableData"
      />
    </NDrawerContent>
  </NDrawer>
  <!-- 任务详情弹窗-->
  <DeviceDetailModal
    :show="taskDetailVisible"
    :title="taskDetailTitle"
    :ota_upgrade_task_id="ota_upgrade_task_id"
    @update:show="closeTaskDetailDrawer"
  />
</template>
