<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInst, FormItemRule } from 'naive-ui';
// import { genderOptions } from '@/constants'
import { addUpgradeTask } from '@/service/api/product';
import { createRequiredFormRule } from '@/utils/form/rule';
import { $t } from '@/locales';
import DeviceSelectList from './device-select-list.vue';

export interface Props {
  /** 弹窗可见性 */
  showModal: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type: 'add';
  dev_config_id: string;
  ota_upgrade_package_id: string;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'TableActionModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add'
});

interface Emits {
  (e: 'update:showModal', showModal: boolean): void;
  (e: 'update:modelValue', val: string): void;
  /** 点击协议 */
  (e: 'success'): void;
}

const emit = defineEmits<Emits>();

const modalVisible = computed({
  get() {
    return props.showModal;
  },
  set(showModal) {
    emit('update:showModal', showModal);
  }
});

const closeModal = () => {
  modalVisible.value = false;
};

const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: $t('page.product.update-ota.updateTask')
  };
  return titles[props.type];
});

const batchSelectModalVisible = ref(false);

const formRef = ref<HTMLElement & FormInst>();

type FormModel = Pick<Api.UpgradeTask.Task, 'name' | 'description' | 'ota_upgrade_package_id'> & {
  ota_upgrade_package_id: string;
  device_id_list: string[];
  remark: string;
};

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule($t('common.pleaseCheckValue')),
  description: createRequiredFormRule($t('common.pleaseCheckValue'))
};

function createDefaultFormModel(): FormModel {
  return {
    name: '',
    description: '',
    ota_upgrade_package_id: props.ota_upgrade_package_id,
    remark: '',
    device_id_list: []
  };
}

function handleUpdateFormModel(model: Partial<FormModel>) {
  Object.assign(formModel, model);
}

function handleUpdateFormModelByModalType() {
  const handlers: Record<ModalType, () => void> = {
    add: () => {
      const defaultFormModel = createDefaultFormModel();
      handleUpdateFormModel(defaultFormModel);
    }
  };

  handlers[props.type]();
}

async function handleSubmit() {
  await formRef.value?.validate();
  let data: any;
  if (props.type === 'add') {
    data = await addUpgradeTask(formModel);
  }
  if (!data.error) {
    emit('success');
  }
  closeModal();
}
const handleChildChange = (newValue: boolean) => {
  batchSelectModalVisible.value = newValue;
};
const handleSubmitData = (deviceIDList: string[]) => {
  formModel.device_id_list = deviceIDList;
};
function batchSelectDevice() {
  batchSelectModalVisible.value = true;
}

watch(
  () => props.showModal,
  newValue => {
    if (newValue) {
      handleUpdateFormModelByModalType();
    }
  }
);
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-700px">
    <NForm ref="formRef" label-placement="left" :label-width="124" :model="formModel" :rules="rules">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="24" :label="$t('page.product.update-ota.taskName')" path="name">
          <NInput v-model:value="formModel.name" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.product.update-ota.selectDevice')" path="device_config_id">
          <NButton class="w-120px" @click="batchSelectDevice">
            {{ $t('page.product.update-ota.batchSelectDevice') }}
          </NButton>
          <span class="ml-2 text-gray-500">{{ $t('generate.selected') }} {{ formModel.device_id_list.length }}</span>
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('common.description')">
          <NInput v-model:value="formModel.description" type="textarea" />
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
  <NModal v-model:show="batchSelectModalVisible">
    <NCard
      style="width: 800px"
      :title="$t('custom.grouping_details.addDeviceToGroup')"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
      <DeviceSelectList
        :dev_config_id="props.dev_config_id"
        @closed_modal="handleChildChange"
        @submit_data="handleSubmitData"
      />
    </NCard>
  </NModal>
</template>

<style scoped></style>
