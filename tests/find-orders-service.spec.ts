import { mock } from 'jest-mock-extended'
import { Estado } from '../src/domain/entities/equipamentEnum/estado'
import { Status } from '../src/domain/entities/equipamentEnum/status'
import { Status as OSStatus } from '../src/domain/entities/serviceOrderEnum/status'
import { Equipment } from '../src/domain/entities/equipment'
import { OrderService } from '../src/domain/entities/order-service'
import { FindOrderServiceController } from '../src/presentation/controller/find-orders-service'
import { ok, serverError } from '../src/presentation/helpers'
import {
  FindOrderService,
  FindOrderServiceUseCaseData
} from '../src/useCases/find-order-service/find-order-service'

const useCaseMocked = mock<FindOrderService>()
const findOrderServiceController = new FindOrderServiceController(useCaseMocked)

const mockedEquipment: Equipment = {
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

const orderService: OrderService = {
  id: 2,
  equipment: mockedEquipment,
  description: 'any_description',
  seiProcess: '123456789',
  senderPhone: '61992809831',
  senderDocument: '12345678910',
  technicianId: '123456',
  technicianName: 'Pessoa',
  createdAt: new Date(),
  updatedAt: new Date(),
  status: OSStatus.MAINTENANCE,
  authorId: '123456789',
  senderName: 'Pessoa 2'
}

const request: FindOrderServiceUseCaseData = {
  type: 0,
  unit: '',
  date: '',
  brand: 0,
  search: '',
  model: '',
  status: ''
}

describe('Should test CreateEquipmentController', () => {
  it('should find order services with success', async () => {
    useCaseMocked.execute.mockResolvedValue({
      isSuccess: true,
      data: [orderService]
    })

    const response = await findOrderServiceController.perform(request)

    expect(response).toEqual(ok(response.data))
    expect(useCaseMocked.execute).toHaveBeenCalledWith(request)
  })

  it('should return server error if success without data', async () => {
    useCaseMocked.execute.mockResolvedValue({
      isSuccess: true
    })

    const response = await findOrderServiceController.perform(request)

    expect(response).toEqual(serverError())
    expect(useCaseMocked.execute).toHaveBeenCalledWith(request)
  })
})
