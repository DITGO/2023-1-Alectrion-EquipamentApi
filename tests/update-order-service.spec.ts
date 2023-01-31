import { MockProxy, mock } from 'jest-mock-extended'
import { Estado } from '../src/domain/entities/equipamentEnum/estado'
import { Status } from '../src/domain/entities/equipamentEnum/status'
import { Status as OSStatus } from '../src/domain/entities/serviceOrderEnum/status'
import { Type } from '../src/domain/entities/equipamentEnum/type'
import { Equipment } from '../src/domain/entities/equipment'
import { History } from '../src/domain/entities/history'
import { OrderService } from '../src/domain/entities/order-service'
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
  CreateOrderServiceError,
  InvalidAuthorError,
  InvalidDateError,
  InvalidSenderError,
  UpdateOrderServiceError
} from '../src/useCases/create-order-service/errors'
import { ListOrderServiceRepository } from '../src/repository/order-service/list-order-service'

describe('Test update order use case', () => {
  let equipmentRepository: MockProxy<ListOneEquipmentRepository>
  let updateEquipmentRepository: MockProxy<UpdateEquipmentRepository>
  let unitRepository: MockProxy<ListOneUnitRepository>
  let historyRepository: MockProxy<CreateHistoryRepository>
  let updateOrderServiceRepository: MockProxy<UpdateOrderServiceRepository>
  let listOrderServiceRepository: MockProxy<ListOrderServiceRepository>
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
    type: Type.CPU,
    initialUseDate: new Date().toISOString(),
    invoiceNumber: 'any'
  }

  const data: UpdateOrderServiceUseCaseData = {
    authorFunctionalNumber: 'author_name',
    authorId: 'author_id',
    date: new Date().toISOString(),
    description: 'any_description',
    equipmentId: 'equipment_id',
    receiverName: 'any_receiver',
    senderFunctionalNumber: 'functional_number',
    senderName: 'any_sender',
    reciverFunctionalNumber: 'any-number',
    id: 'any_id',
    status: 'MAINTENANCE' as OSStatus,
    techinicias: [],
    receiverDate: null
  }

  const orderService: OrderService = {
    createdAt: new Date(),
    updatedAt: new Date(),
    date: new Date(),
    id: 'any_id',
    equipment,
    authorId: 'any_author',
    receiverName: '',
    equipmentSnapshot: equipment,
    sender: 'any_sender',
    senderFunctionalNumber: 'any_sender_number',
    history: {
      equipmentSnapshot: {},
      equipment,
      createdAt: new Date(),
      id: 'any_id',
      updatedAt: new Date()
    },
    receiverFunctionalNumber: 'any_number',
    status: 'MAINTENANCE' as OSStatus
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
      unitRepository,
      historyRepository,
      updateOrderServiceRepository,
      listOrderServiceRepository
    )

    equipmentRepository.listOne.mockResolvedValue(equipment)
    unitRepository.listOne.mockResolvedValue({
      createdAt: new Date(),
      id: 'any_id',
      name: 'any_name',
      updatedAt: new Date(),
      localization: 'any_localization'
    })
    /* updateOrderServiceRepository.updateOrderSevice.mockResolvedValue(
        orderService
    ) */
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
  test('should return UpdateOrderServiceError if history returns undefined', async () => {
    historyRepository.create.mockResolvedValueOnce(null)

    const result = await updateOrderServiceUseCase.execute(data)

    expect(result).toEqual({
      isSuccess: false,
      error: new UpdateOrderServiceError()
    })
  })

  test('should return InvalidAuthorError if receiverName equals undefined', async () => {
    const result = await updateOrderServiceUseCase.execute({
      ...data,
      receiverName: undefined
    })

    expect(result).toEqual({
      isSuccess: false,
      error: new InvalidAuthorError()
    })
  })

  test('should return InvalidDateError if date was undefined', async () => {
    const result = await updateOrderServiceUseCase.execute({
      ...data,
      date: undefined
    })

    expect(result).toEqual({
      isSuccess: false,
      error: new InvalidDateError()
    })
  })

  test('should return InvalidSenderError if senderName was undefined', async () => {
    const result = await updateOrderServiceUseCase.execute({
      ...data,
      senderName: undefined
    })

    expect(result).toEqual({
      isSuccess: false,
      error: new InvalidSenderError()
    })
  })
})
