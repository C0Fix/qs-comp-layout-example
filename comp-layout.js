/*globals define*/

define([
	"jquery",
	"text!./comp-layout.ng.html",
	"text!./comp-layout.css"
	],
function($, template, style ) {
	'use strict';

	$("<style>").html( style ).appendTo("head");

	var ComponentLayoutExtension,
		layoutRules;

	function updateCSSOfLayoutRules( layoutRules ){

		layoutRules.forEach( function( componentLayout ) {
			//recursive
			if ( componentLayout.components ) {
				updateCSSOfLayoutRules( componentLayout.components );
			}

			if( componentLayout.element ){
				var cssSuffix, cssMultiplier;
				if( componentLayout.width ){
					cssSuffix = ( componentLayout.width.min > 1  || componentLayout.width.max > 1 ) ? "px" : "%";
					cssMultiplier = cssSuffix == "%" ? 100 : 1;
					componentLayout.element.css( {
						minWidth:componentLayout.width.min * cssMultiplier + cssSuffix,
						maxWidth: componentLayout.width.max * cssMultiplier + cssSuffix
					} );
				}
				if( componentLayout.height ){
					cssSuffix = ( componentLayout.height.min > 1  || componentLayout.height.max > 1 ) ? "px" : "%";
					cssMultiplier = cssSuffix == "%" ? 100 : 1;
					componentLayout.element.css( {
						minHeight:componentLayout.height.min * cssMultiplier + cssSuffix,
						maxHeight: componentLayout.height.max * cssMultiplier + cssSuffix
					} );
				}
			}
		} );
	}

	function setComponentSizes( layoutRules, direction ){

		var self = this,
			rootWidth = this.$element.width(),
			rootHeight = this.$element.height(),
			accWidth = 0,
			accHeight = 0,
			reverseLayoutRules,
			componentCounter = 0,
			noFitComponents = [],
			comp;


		layoutRules.forEach( function( componentLayout ){

			//recursive
			if ( componentLayout.components ) {
				setComponentSizes.call( self, componentLayout.components, direction === "row" ? "column" : "row" ); //the direction of the levels are assumed to always be opposite.
			}

			//if the component would get all the space in it's parent, would it fit?
			if( componentLayout.width && componentLayout.width.min > rootWidth || componentLayout.height && componentLayout.height.min > rootHeight ){
				noFitComponents.push( componentLayout );
				componentLayout.element.css({
					display:"none"
				});
			}

			//check if everything fits
			if( direction === "row" ){
				accWidth += componentLayout.width ? ( componentLayout.width.min ? ( componentLayout.width.min > 1 ? componentLayout.width.min / rootWidth : componentLayout.width.min ) : 0 ) : 0;
			}
			else{
				accHeight += componentLayout.height ? ( componentLayout.height.min ? ( componentLayout.height.min > 1 ? componentLayout.height.min / rootHeight : componentLayout.height.min ) : 0 ) : 0;
			}
		});

		//if not, remove components starting from the end of the array - until they all fit
		if( accWidth > 1 || accHeight > 1 ){
			reverseLayoutRules = layoutRules.concat().reverse();
			while( accWidth > 1 || accHeight > 1 && componentCounter < layoutRules.length ){
				comp = reverseLayoutRules[componentCounter];
				comp.element.css({
					display:"none"
				});

				accWidth -= comp.width ? ( comp.width.min >= 1 ? comp.width.min / rootWidth : comp.width.min ) : 0 ;
				accHeight -= comp.height? ( comp.height.min >= 1 ? comp.height.min / rootHeight : comp.height.min ) : 0 ;
				componentCounter++;
			}
		}

		//the rest of the objects should be visible
		for( var i = 0; i < ( layoutRules.length - componentCounter ); i++ ){
			if( noFitComponents.indexOf( layoutRules[i] ) === -1 ){
				layoutRules[i].element.css( {display: "flex" } );
			}
		}

		//if it still does not fit we just throw an exception
		if( accWidth > 1 || accHeight > 1 ){
			throw "Object too small to fit any component";
		}

	}

	ComponentLayoutExtension = {
		template : template,
		paint: function( $element, layout ) {
			setComponentSizes.call( this, layoutRules, "row" );
		},
		controller:['$scope', '$element', function( $scope, $element ){

			layoutRules = [{
				element: $element,
				components: [{
					element: $( ".first-row" ),
					height: {
						min: 0.7 // values between 0-1 counts as percentages
					},
					components: [{ //the order of the components sets the priority for removing them
						element: $( ".chart-area" ),
						width: {
							min: 0.6
						},
						height: {
							min: 0.7
						}
					}, {
						element: $( ".y-axis" ),
						height: {
							min: 100 //values above 1 counts as pixels
						},
						width: {
							min: 100,
							max: 200
						}
					}, {
						element: $( ".color-legend" ),
						width: {
							min: 120,
							max: 200
						},
						height: {
							min: 100
						}
					}
					]
				},
				{
					element: $( ".second-row" ),
					height: {
						min: 50,
						max: 200
					},
					width: {
						min: 80
					},
					components: [{
						element: $( ".x-axis" )
					}]
				}]
			}];

			updateCSSOfLayoutRules( layoutRules );
		}]
	};

	return ComponentLayoutExtension;
});
