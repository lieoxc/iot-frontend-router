<script setup lang="tsx">
import { computed, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useBoolean, useLoading } from '@sa/hooks';
import dayjs from 'dayjs';
import { userStatusOptions } from '@/constants/business';
import { delPackage,fetchPackageList } from '@/service/api/product';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';
import TableActionModal from './components/table-action-modal.vue';
import type { ModalType } from './components/table-action-modal.vue';
// import ColumnSetting from './components/column-setting.vue'

const authStore = useAuthStore();
const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
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
    align: 'left'
  },
  {
    key: 'package_type',
    minWidth: '140px',
    title: () => $t('page.product.update-package.type'),
    align: 'left',
    render: row => {
      if (row.package_type) {
        const key = row.package_type === 1 ? 'page.product.update-package.diff' : 'page.product.update-package.full';
        return <NTag>{$t(key)}</NTag>;
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
          <NButton type="primary" size={'small'} onClick={() => handleEditTable(row.id)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm
            negative-text={$t('common.cancel')}
            positive-text={$t('common.confirm')}
            onPositiveClick={() => handleDeleteTable(row.id)}
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
]) as Ref<DataTableColumns<Api.UpdatePackage.Package>>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<Api.UpdatePackage.Package | null>(null);

function setEditData(data: Api.UpdatePackage.Package | null) {
  editData.value = data;
}

function handleAddTable() {
  openModal();
  setModalType('add');
}

function handleEditTable(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId);
  if (findItem) {
    setEditData(findItem);
  }
  setModalType('edit');
  openModal();
}

async function handleDeleteTable(rowId: string) {
  const data = await delPackage(rowId);
  if (!data.error) {
    window.$message?.success($t('common.deleteSuccess'));
    getTableData();
  }
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
        <NSpace class="pb-12px" justify="space-between">
          <NSpace>
            <NButton type="primary" @click="handleAddTable">
              <IconIcRoundPlus class="mr-4px text-20px" />
              {{ $t('common.add') }}
            </NButton>
          </NSpace>
        </NSpace>
        <NCard></NCard>
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
        <TableActionModal v-model:visible="visible" :type="modalType" :edit-data="editData" @success="getTableData" />
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
