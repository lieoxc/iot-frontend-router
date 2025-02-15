<script setup lang="tsx">
import { provide, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NSpace } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import dayjs from 'dayjs';
import { fetchPackageList } from '@/service/api/product';
import { $t } from '@/locales';
import TableActionDrawer from './components/table-action-drawer.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const showEmpty = ref(false);

type QueryFormModel = Pick<Api.UpdatePackage.Package, 'name'> & {
  page: number;
  page_size: number;
};

const queryParams = reactive<QueryFormModel>({
  name: null,
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

const tableData = ref<Api.UpdatePackage.Package[]>([]);

function setTableData(data: Api.UpdatePackage.Package[]) {
  if (data === null) {
    showEmpty.value = true;
  } else {
    showEmpty.value = false;
    tableData.value = data;
  }
}

async function getTableData() {
  startLoading();
  const { data } = await fetchPackageList(queryParams);
  if (data) {
    const list: Api.UpdatePackage.Package[] = data.list;
    pagination.itemCount = data.total;
    setTableData(list);
    endLoading();
  }
}

const columns: Ref<DataTableColumns<Api.UpdatePackage.Package>> = ref([
  {
    key: 'name',
    minWidth: '140px',
    title: () => $t('page.product.update-package.packageName'),
    align: 'left'
  },
  {
    key: 'version',
    minWidth: '140px',
    title: () => $t('page.product.update-package.versionCode'),
    align: 'left'
  },
  {
    key: 'device_config_id',
    minWidth: '140px',
    title: () => $t('page.product.update-package.deviceConfig'),
    align: 'left',
    render: row => {
      if (row.device_config_id) {
        return $t(row.device_config_name);
      }
      return <span></span>;
    }
  },
  {
    key: 'package_type',
    minWidth: '140px',
    title: () => $t('page.product.update-package.type'),
    align: 'left',
    render: row => {
      if (row.package_type) {
        const key = row.package_type === 1 ? 'page.product.update-package.diff' : 'page.product.update-package.full';
        return $t(key);
      }
      return <span></span>;
    }
  },
  {
    key: 'created_at',
    minWidth: '140px',
    title: () => $t('common.creationTime'),
    align: 'left',
    render: row => dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    key: 'remark',
    minWidth: '140px',
    title: () => $t('common.remark'),
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
          <NButton type="primary" size={'small'} onClick={() => handleLookTask(row.id)}>
            {$t('page.product.update-ota.lookTask')}
          </NButton>
        </NSpace>
      );
    }
  }
]) as Ref<DataTableColumns<Api.UpdatePackage.Package>>;

const ota_upgrade_package_id = ref<string | null>(null);
const dev_config_id = ref<string | null>(null);
const drawerVisible = ref(false); // 用于控制任务详情抽屉是否展示
const drawerTitle = ref(''); // 抽屉标题

provide('dev_config_id', dev_config_id);

function handleLookTask(rowId: string): void {
  const findItem = tableData.value.find(item => item.id === rowId);
  if (findItem) {
    ota_upgrade_package_id.value = findItem.id;
    dev_config_id.value = findItem.device_config_id;
  }
  drawerTitle.value = $t('page.product.update-ota.lookTask');
  drawerVisible.value = true;
}

function handleDrawerSuccess() {
  getTableData(); // 刷新数据
  drawerVisible.value = false; // 关闭抽屉
}

function init() {
  getTableData();
}

// 初始化
init();
</script>

<template>
  <div>
    <NCard :title="$t('route.management_packageList')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <NDataTable
          v-if="!showEmpty"
          :row-key="row => row.id"
          :remote="true"
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          class="flex-1-hidden"
        />
        <div v-if="showEmpty" class="h-500px flex-center flex-col">
          <n-empty :description="$t('common.nodata')"></n-empty>
        </div>
        <TableActionDrawer
          v-model:visible="drawerVisible"
          :title="drawerTitle"
          :ota_upgrade_package_id="ota_upgrade_package_id"
          :dev_config_id="dev_config_id"
          @success="handleDrawerSuccess"
        />
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
