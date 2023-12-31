import { MockProxy, mock } from 'jest-mock-extended'
import { Estado } from '../src/domain/entities/equipamentEnum/estado'
import { Status } from '../src/domain/entities/equipamentEnum/status'
import { Status as OSStatus } from '../src/domain/entities/serviceOrderEnum/status'
import { History } from '../src/domain/entities/history'
import { Equipment } from '../src/domain/entities/equipment'
import { ListOneEquipmentRepository } from '../src/repository/equipment/list-one-equipment'
import { UpdateEquipmentRepository } from '../src/repository/equipment/update-equipment'
import { CreateHistoryRepository } from '../src/repository/history/create-history-repository'
import { UpdateOrderServiceRepository } from '../src/repository/order-service/update-order-service-repository'
import { ListOneUnitRepository } from '../src/repository/unit/list-one-unit'
import {
  UpdateOrderServiceUseCase,
  UpdateOrderServiceUseCaseData
} from '../src/useCases/update-order-service/update-order-service'
import {
  EquipmentNotFoundError,
  UpdateOrderServiceError
} from '../src/useCases/create-order-service/errors'

describe('Test update order use case', () => {
  let equipmentRepository: MockProxy<ListOneEquipmentRepository>
  let updateEquipmentRepository: MockProxy<UpdateEquipmentRepository>
  let unitRepository: MockProxy<ListOneUnitRepository>
  let historyRepository: MockProxy<CreateHistoryRepository>
  let updateOrderServiceRepository: MockProxy<UpdateOrderServiceRepository>
  let updateOrderServiceUseCase: UpdateOrderServiceUseCase

  const equipment: Equipment = {
    id: 'id',
    acquisitionDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    situacao: Status.ACTIVE,
    estado: Estado.Novo,
    tippingNumber: 'any',
    model: 'DELL G15',
    serialNumber: 'any',
    type: { id: 2, name: 'any', createdAt: new Date(), updatedAt: new Date() }
  }

  const data: UpdateOrderServiceUseCaseData = {
    id: 2,
    equipmentId: 'equipment_id',
    description: 'any_description',
    seiProcess: '123456789',
    senderPhone: '61992809831',
    senderDocument: '12345678910',
    technicianId: '123456',
    technicianName: 'Pessoa',
    status: 'MAINTENANCE' as OSStatus
  }

  const dataFinished: UpdateOrderServiceUseCaseData = {
    id: 2,
    equipmentId: 'equipment_id',
    description: 'any_description',
    seiProcess: '123456789',
    senderPhone: '61992809831',
    senderDocument: '12345678910',
    technicianId: '123456',
    technicianName: 'Pessoa',
    withdrawalName: 'Recebedor',
    withdrawalDocument: '98765432198',
    status: 'FINISHED' as OSStatus
  }

  const dataCanceled: UpdateOrderServiceUseCaseData = {
    id: 2,
    equipmentId: 'equipment_id',
    description: 'any_description',
    seiProcess: '123456789',
    senderPhone: '61992809831',
    senderDocument: '12345678910',
    technicianId: '123456',
    technicianName: 'Pessoa',
    status: 'CANCELED' as OSStatus
  }

  beforeEach(() => {
    equipmentRepository = mock()
    updateEquipmentRepository = mock()
    unitRepository = mock()
    historyRepository = mock()
    updateOrderServiceRepository = mock()
    updateOrderServiceUseCase = new UpdateOrderServiceUseCase(
      equipmentRepository,
      updateEquipmentRepository,
      historyRepository,
      updateOrderServiceRepository
    )

    equipmentRepository.listOne.mockResolvedValue(equipment)
    unitRepository.listOne.mockResolvedValue({
      createdAt: new Date(),
      id: 'any_id',
      name: 'any_name',
      updatedAt: new Date(),
      localization: 'any_localization'
    })
  })
  test('should call equipment repository with correct params', async () => {
    await updateOrderServiceUseCase.execute(data)

    expect(equipmentRepository.listOne).toBeCalledWith(data.equipmentId)
  })

  test('should return EquipmentNotFoundError if no equipment was found', async () => {
    equipmentRepository.listOne.mockResolvedValueOnce(undefined)

    const result = await updateOrderServiceUseCase.execute(data)

    expect(equipmentRepository.listOne).toBeCalledWith(data.equipmentId)
    expect(result).toEqual({
      isSuccess: false,
      error: new EquipmentNotFoundError()
    })
  })

  test('should update equipment history if equipment found doesnt have history', async () => {
    await updateOrderServiceUseCase.execute(data)

    expect(historyRepository.create).toBeCalledTimes(1)
    expect(historyRepository.create).toBeCalledWith({
      equipment,
      equipmentSnapshot: equipment
    })
  })

  test('should update history if equipment found already has history', async () => {
    const history = {
      createdAt: new Date(),
      updatedAt: new Date(),
      equipment,
      id: 'any_id',
      equipmentSnapshot: {}
    }
    equipmentRepository.listOne.mockResolvedValueOnce({
      ...equipment,
      history
    })

    await updateOrderServiceUseCase.execute(data)

    expect(historyRepository.create).toBeCalledTimes(0)
    expect(updateOrderServiceUseCase.history).toEqual(history)
  })

  test('should update history if equipment found already has history', async () => {
    const history: History = {
      createdAt: new Date(),
      updatedAt: new Date(),
      equipment,
      id: 'any_id',
      equipmentSnapshot: {}
    }
    equipmentRepository.listOne.mockResolvedValueOnce({
      ...equipment,
      history
    })

    await updateOrderServiceUseCase.execute(data)

    expect(historyRepository.create).toBeCalledTimes(0)
    expect(updateOrderServiceUseCase.history).toEqual(history)
  })

  test('should update order service', async () => {
    const result = await updateOrderServiceUseCase.execute(data)

    expect(result).toEqual({
      isSuccess: true
    })
  })

  test('should call updateEquipmentRepository if order service was updated', async () => {
    const result = await updateOrderServiceUseCase.execute(data)

    expect(updateEquipmentRepository.updateEquipment).toBeCalledTimes(1)
    expect(updateEquipmentRepository.updateEquipment).toBeCalledWith(
      equipment.id,
      {
        situacao: Status.MAINTENANCE
      }
    )

    expect(result).toEqual({
      isSuccess: true
    })
  })

  test('should call updateEquipmentRepository if order service status was updated to finished', async () => {
    const result = await updateOrderServiceUseCase.execute(dataFinished)

    expect(updateEquipmentRepository.updateEquipment).toBeCalledTimes(1)
    expect(updateEquipmentRepository.updateEquipment).toBeCalledWith(
      equipment.id,
      {
        situacao: Status.ACTIVE
      }
    )

    expect(result).toEqual({
      isSuccess: true
    })
  })

  test('should call updateEquipmentRepository if order service status was updated to canceled', async () => {
    const result = await updateOrderServiceUseCase.execute(dataCanceled)

    expect(updateEquipmentRepository.updateEquipment).toBeCalledTimes(1)
    expect(updateEquipmentRepository.updateEquipment).toBeCalledWith(
      equipment.id,
      {
        situacao: Status.ACTIVE
      }
    )

    expect(result).toEqual({
      isSuccess: true
    })
  })

  test('should return UpdateOrderServiceError if history returns undefined', async () => {
    historyRepository.create.mockResolvedValueOnce(null)

    const result = await updateOrderServiceUseCase.execute(data)

    expect(result).toEqual({
      isSuccess: false,
      error: new UpdateOrderServiceError()
    })
  })
})
