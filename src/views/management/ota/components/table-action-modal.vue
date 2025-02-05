<script setup lang="ts">
import { computed, reactive, ref, toRefs, watch,onUpdated } from 'vue';
import type { FormInst, FormItemRule } from 'naive-ui';
// import { genderOptions } from '@/constants'
import { editPackage,addPackage } from '@/service/api/product';
import { createRequiredFormRule } from '@/utils/form/rule';
import { packageOptions } from '@/constants/business';
import { getDemoServerUrl, getFileName } from '@/utils/common/tool';
import { localStg } from '@/utils/storage';
import type { UploadFileInfo } from 'naive-ui';
import { $t } from '@/locales';
const url = ref(new URL(getDemoServerUrl()));

import BatchSelectDeviceModal from './batch-select-device.vue';

export interface Props {
  /** 弹窗可见性 */
  showModal: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type: 'add' ;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'TableActionModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
});

interface Emits {
  (e: 'update:showModal', showModal: boolean): void;

  /** 点击协议 */
  (e: 'success'): void;
  (e: 'update:modelValue', val: string): void;
  (e: 'success', file: UploadFileInfo): void;
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

type FormModel = Pick<Api.UpdatePackage.Package, 'name' |'description'>

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule($t('common.pleaseCheckValue')),
  description: createRequiredFormRule($t('common.pleaseCheckValue'))
};

function createDefaultFormModel(): FormModel {
  return {
    name: '',
    description: ""
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
    data = await addPackage(formModel);
  }
  if (!data.error) {
    emit('success');
  }
  closeModal();
}

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
          <NButton class="w-120px" @click="batchSelectDevice">{{ $t('page.product.update-ota.batchSelectDevice') }}</NButton>
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
  <BatchSelectDeviceModal v-model:show="batchSelectModalVisible" />
</template>

<style scoped></style>
