export default
/*@ngInject*/
function() {
  return {
    restrict: 'EA',
    scope: {
      daterange: '='
    },
    link: function (scope, element, attrs) {
      scope.$watch('daterange', function () {
        element.data('daterangepicker').setStartDate(moment(scope.daterange, 'YYYY-MM-DD').format('DD/MM/YYYY'));
      });

      element.daterangepicker({
        locale: {
          format: 'DD/MM/YYYY'
        },
        "startDate": scope.daterange,
        "autoApply": true,
        "singleDatePicker": true
      }, function (date) {

        scope.daterange = date.format('YYYY-MM-DD');
        scope.$apply();
      });
    }
  };
}