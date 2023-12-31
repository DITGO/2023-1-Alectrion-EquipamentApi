import { ScreenType } from '../../domain/entities/equipamentEnum/screenType'
import { Status } from '../../domain/entities/equipamentEnum/status'
import { StorageType } from '../../domain/entities/equipamentEnum/storageType'
import { Unit } from '../../domain/entities/unit'
import { EquipmentAcquisition } from '../../db/entities/equipment-acquisition'
import { EquipmentType } from '../../db/entities/equipment-type'
import { EquipmentBrand } from '../../db/entities/equipment-brand'

export type EditPayload = {
  serialNumber?: string
  tippingNumber?: string
  type?: EquipmentType
  situacao?: Status
  estado?: string
  model?: string
  description?: string
  acquisitionDate?: Date
  screenSize?: string
  power?: string
  screenType?: ScreenType
  processor?: string
  storageType?: StorageType
  storageAmount?: string
  brand?: EquipmentBrand
  acquisition?: EquipmentAcquisition
  ram_size?: string
  unitId?: string
  unit?: Unit
}

export interface UpdateEquipmentRepository {
  updateEquipment(equipmentId: string, editPayload: EditPayload): Promise<void>
}
