'use strict'

angular.module('zillion', ['angular-carousel','angular-loading-bar'])

.controller('MainCtrl', function($http, $scope) {


    $scope.search = function() {
        console.log($scope.data);

        $http({
            method: 'POST',
            url: '/api/search/',
            params: {
                data: $scope.data
            }
        }).then(function successCallback(response) {
            console.log(response);
            $scope.images = response.data;
        }, function errorCallback(response) {

        });
    }

})

.controller('keywordCtrl', function($http, $scope) {

    $http({
        method: 'GET',
        url: '/api/getsearch/',
    }).then(function successCallback(response) {
        console.log(response);
        $scope.keywords = response.data;
    }, function errorCallback(response) {

    });


    $scope.datByKeyword = function(data) {
        
        $scope.images =data;
    }


})