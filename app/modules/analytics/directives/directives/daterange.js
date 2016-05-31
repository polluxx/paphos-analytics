export default
/*@ngInject*/
function($rootScope, $stateParams, dateService) {
  return {
    restrict: 'EA',
    scope: {
      daterange: '='
    },
    link: function (scope, element, attrs) {
      dateService.start = dateService.start ||  $stateParams.startDate || moment().subtract(6, 'days').format('YYYY-MM-DD');
      dateService.end = dateService.end || $stateParams.endDate || moment().format('YYYY-MM-DD');
      $stateParams.startDate = dateService.start;
      element.daterangepicker({
        locale: {
          format: 'DD/MM/YYYY'
        },
        "startDate": moment(dateService.start, 'YYYY-MM-DD').format('DD/MM/YYYY'),
        "endDate": moment(dateService.end, 'YYYY-MM-DD').format('DD/MM/YYYY'),
        "autoApply": true
      }, function (start, end) {
        dateService.start = moment(start, 'DD/MM/YYYY').format('YYYY-MM-DD');
        dateService.end = moment(end, 'DD/MM/YYYY').format('YYYY-MM-DD');
        scope.$apply();
      });
    }
  };
}