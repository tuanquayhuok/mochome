const ORDER_STATUS_PIPELINE = ['pending', 'processing', 'shipping', 'completed'];

const TERMINAL_STATUSES = ['completed', 'cancelled', 'returned'];

const STATUS_FLOW_LABELS = {
  pending: 'Đã đặt',
  processing: 'Đã thanh toán',
  shipping: 'Đã giao',
  completed: 'Đã nhận',
  cancelled: 'Đã hủy',
  returned: 'Hoàn trả'
};

const getNextStatus = (currentStatus) => {
  const index = ORDER_STATUS_PIPELINE.indexOf(currentStatus);
  if (index === -1 || index >= ORDER_STATUS_PIPELINE.length - 1) {
    return null;
  }
  return ORDER_STATUS_PIPELINE[index + 1];
};

const isValidStatusTransition = (fromStatus, toStatus) => {
  if (fromStatus === toStatus) {
    return true;
  }
  return getNextStatus(fromStatus) === toStatus;
};

const isInPipeline = (status) => ORDER_STATUS_PIPELINE.includes(status);

const EDITABLE_STATUSES = ['pending', 'processing'];
const CANCELLABLE_STATUSES = ['pending', 'processing'];

const CANCELLATION_REASONS = {
  no_longer_want: 'Không muốn mua nữa',
  out_of_money: 'Hết tiền',
  wrong_address: 'Nhập sai địa chỉ',
  found_cheaper: 'Tìm được giá rẻ hơn',
  other: 'Lý do khác'
};

const isOrderEditable = (status) => EDITABLE_STATUSES.includes(status);
const isOrderCancellable = (status) => CANCELLABLE_STATUSES.includes(status);

const formatCancellationReason = (reason, other) => {
  if (!reason) return '';
  if (reason === 'other') {
    return other?.trim() || CANCELLATION_REASONS.other;
  }
  return CANCELLATION_REASONS[reason] || reason;
};

module.exports = {
  ORDER_STATUS_PIPELINE,
  TERMINAL_STATUSES,
  STATUS_FLOW_LABELS,
  EDITABLE_STATUSES,
  CANCELLABLE_STATUSES,
  CANCELLATION_REASONS,
  getNextStatus,
  isValidStatusTransition,
  isInPipeline,
  isOrderEditable,
  isOrderCancellable,
  formatCancellationReason
};
