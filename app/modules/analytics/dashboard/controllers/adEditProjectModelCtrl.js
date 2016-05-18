export default
  /*@ngInject*/
  function($scope, aAuthModel, aTempSiteModel, aSiteModel) {

    $scope.signIn = () => {
      aAuthModel.signIn((resp) => $scope.getTempSites);
    };

    $scope.checked = [];

    $scope.saveItem = () => {
      var sitesToSave = $scope.sites.filter((site) => {
        return site.$checked;
      });
      if(!sitesToSave.length) return;

      $scope.loading = true;
      sitesToSave.forEach((site) => {
        var savedItem = new aSiteModel(site);
        if (!savedItem['siteUrl']) return;
        delete savedItem.token;
        delete savedItem._id;
        delete savedItem.$checked;

        console.log(site);
        aSiteModel.query({siteUrl: savedItem.siteUrl, page: 1, perPage: 1}, (res) => {
          if(!res.length) {
            savedItem.$create((res, err) => {
              console.log(res, err)
            });
          }
          //site.$remove({_id: site._id});
        });

      });
      $scope.$close();
      $scope.loading = false;
      // $scope.tableParams.reload();

    }

    $scope.getTempSites = function() {
      aTempSiteModel.query({page: 1, perPage: 10}, function (sites) {
        $scope.sites = sites;
      });
    }

    $scope.check = (_id) => {
      var index = $scope.checked.indexOf(_id);
      if(index === -1) {
        $scope.checked.push(_id);
      } else {
        $scope.checked.splice(index, 1);
      }
    }

    $scope.getTempSites();

  }