<script setup lang="ts">
import { onUpdated, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import dayjs from 'dayjs';
import { useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { fetchUpgradeTaskDetail } from '@/service/api/product';

const { startLoading, endLoading } = useLoading(false);
const DetailData = ref<Api.UpgradeDetail.Detail[]>([]);
const showEmpty = ref(false);

const props = defineProps({
  taskDetailShow: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  ota_upgrade_task_id: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:show']);
const visible = ref(props.taskDetailShow);

type QueryFormModelDetail = Pick<Api.UpgradeDetail.Detail, 'ota_upgrade_task_id'> & {
  page: number;
  page_size: number;
};

const queryParamsDetail = reactive<QueryFormModelDetail>({
  ota_upgrade_task_id: props.ota_upgrade_task_id,
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
    paginationDetail.page = page;
    queryParamsDetail.page = page;
    getDetailTableData();
  },
  onUpdatePageSize: (pageSize: number) => {
    paginationDetail.pageSize = pageSize;
    paginationDetail.page = 1;
    queryParamsDetail.page = 1;
    queryParamsDetail.page_size = pageSize;
    getDetailTableData();
  }
});

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
    align: 'left',
    render: row => {
      const statusMap: { [key: number]: string } = {
        1: '待推送',
        2: '已推送',
        3: '升级中',
        4: '升级成功',
        5: '升级失败',
        6: '已取消'
      };
      return statusMap[row.status] || $t('page.product.update-ota.unknownStatus'); // 若 status 不是 1-6 之间的数字，则返回“未知状态”
    }
  },
  {
    key: 'status_description',
    minWidth: '120px',
    title: () => $t('page.product.update-ota.statusDetail'),
    align: 'left'
  }
]) as Ref<DataTableColumns<Api.UpgradeDetail.Detail>>;

const handleClose = value => {
  emit('update:show', value);
  if (!value) {
    DetailData.value = []; // 关闭时清空数据
  }
};

async function getDetailTableData() {
  startLoading();
  queryParamsDetail.ota_upgrade_task_id = props.ota_upgrade_task_id;
  const { data } = await fetchUpgradeTaskDetail(queryParamsDetail);
  if (data) {
    const list: Api.UpgradeDetail.Detail[] = data.list;
    paginationDetail.itemCount = data.total;
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

watch(
  () => props.taskDetailShow,
  async newVal => {
    visible.value = newVal;
    if (newVal) {
      await getDetailTableData();
    }
  }
);
watch(
  () => props.ota_upgrade_task_id,
  newVal => {
    if (visible.value && newVal) {
      getDetailTableData();
    }
  }
);
onUpdated(() => {
  getDetailTableData();
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="title"
    class="w-1000px"
    :mask-closable="false"
    @update:show="handleClose"
  >
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
  </NModal>
</template>
