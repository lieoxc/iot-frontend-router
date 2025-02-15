<script setup lang="tsx">
import { defineEmits, defineProps, onUpdated, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { NButton, NSpace } from 'naive-ui';
import dayjs from 'dayjs';
import { useBoolean, useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { fetchUpgradeTaskDetail, fetchUpgradeTaskList } from '@/service/api/product';
import TableActionModal from './table-action-modal.vue';
import type { ModalType } from './table-action-modal.vue';

const { startLoading, endLoading } = useLoading(false);
const { bool: showModal, setTrue: openModal } = useBoolean();

const showEmpty = ref(false);
const tableData = ref<Api.UpgradeTask.Task[]>([]);
const DetailData = ref<Api.UpgradeDetail.Detail[]>([]);
const taskDetailVisible = ref(false); // 控制任务详情抽屉的显示

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

type QueryFormModelDetail = Pick<Api.UpgradeDetail.Detail, 'ota_upgrade_task_id'> & {
  page: number;
  page_size: number;
};

const queryParamsDetail = reactive<QueryFormModelDetail>({
  ota_upgrade_task_id: '',
  page: 1,
  page_size: 10
});

const paginationDetail: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  itemCount: 0,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page;
    queryParams.page = page;
    getDetailTableData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    queryParams.page = 1;
    queryParams.page_size = pageSize;
    getDetailTableData();
  }
});

const emits = defineEmits(['update:visible', 'success']);

async function getTableData() {
  startLoading();
  console.log('table-action-drawer ota_upgrade_package_id: ', props.ota_upgrade_package_id);
  console.log('table-action-drawer dev_config_id: ', props.dev_config_id);
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

async function getDetailTableData() {
  startLoading();
  const { data } = await fetchUpgradeTaskDetail(queryParamsDetail);
  if (data) {
    const list: Api.UpgradeDetail.Detail[] = data.list;
    pagination.itemCount = data.total;
    setDetailTableData(list);
  }
  endLoading();
}
function setDetailTableData(data: Api.UpgradeDetail.Detail[]) {
  if (data === null) {
    showEmpty.value = true;
  } else {
    showEmpty.value = false;
    DetailData.value = data;
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
        </NSpace>
      );
    }
  }
]) as Ref<DataTableColumns<Api.UpgradeTask.Task>>;

const columnsDetail: Ref<DataTableColumns<Api.UpgradeDetail.Detail>> = ref([
  {
    key: 'name',
    minWidth: '120px',
    title: () => $t('page.product.update-ota.deviceName'),
    align: 'left'
  },
  {
    key: 'current_version',
    minWidth: '120px',
    title: () => $t('page.product.update-ota.currentVersion'),
    align: 'left'
  },
  {
    key: 'version',
    minWidth: '120px',
    title: () => $t('page.product.update-ota.targetVersion'),
    align: 'left'
  },
  {
    key: 'steps',
    minWidth: '120px',
    title: () => $t('page.product.update-ota.progress'),
    align: 'left'
  },
  {
    key: 'updated_at',
    minWidth: '120px',
    title: () => $t('page.product.update-ota.updateTime'),
    align: 'left',
    render: row => dayjs(row.updated_at).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    key: 'status',
    minWidth: '120px',
    title: () => $t('page.product.update-ota.statusTask'),
    align: 'left'
  },
  {
    key: 'status_description',
    minWidth: '120px',
    title: () => $t('page.product.update-ota.statusDetail'),
    align: 'left'
  }
]) as Ref<DataTableColumns<Api.UpgradeDetail.Detail>>;

function closeTaskDetailDrawer() {
  taskDetailVisible.value = false; // 关闭任务详情抽屉
}

async function handleTaskDetail(rowId: string) {
  startLoading();
  const findItem = tableData.value.find(item => item.id === rowId);
  if (findItem) {
    console.log('Drawer rowId:', rowId);
    queryParamsDetail.ota_upgrade_task_id = rowId;
    const { data } = await fetchUpgradeTaskDetail(queryParamsDetail);
    if (data) {
      const list: Api.UpgradeDetail.Detail[] = data.list;
      pagination.itemCount = data.total;
      setDetailTableData(list);
    }
    taskDetailVisible.value = true; // 显示任务详情抽屉
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
  <!-- 任务详情抽屉组件 -->
  <NDrawer
    :show="taskDetailVisible"
    placement="right"
    :width="900"
    native-scrollbar
    @update:show="value => (taskDetailVisible.value = value)"
  >
    <NDrawerContent :title="$t('page.product.update-ota.taskDetail')">
      <div class="drawer-header">
        <NSpace justify="space-between" align="center" class="mb-4">
          <NButton type="default" size="small" @click="closeTaskDetailDrawer">
            {{ $t('custom.management.close') }}
          </NButton>
        </NSpace>
      </div>

      <div>
        <NDataTable
          v-if="DetailData.length > 0"
          :columns="columnsDetail"
          :data="DetailData"
          :bordered="false"
          :pagination="paginationDetail"
        />
        <div v-else class="empty-state">
          <NEmpty description="无数据" />
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>
