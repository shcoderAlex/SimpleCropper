/* 
    Author     : Tomaz Dragar
    Mail       : <tomaz@dragar.net>
    Homepage   : http://www.dragar.net
*/

(function ($) {

    $.fn.simpleCropper = function (onComplete, notComplete) {

        var image_dimension_x = 600;
        var image_dimension_y = 600;
        var scaled_width = 0;
        var scaled_height = 0;
        var x1 = 0;
        var y1 = 0;
        var x2 = 0;
        var y2 = 0;
        var current_image = null;
        var image_filename = null;
        var aspX = 1;
        var aspY = 1;
        var file_display_area = null;
        var ias = null;
        var original_data = null;
        var jcrop_api;
        var selector = $(this).selector;
        var item = null;

        var modal = "<div id='modal'></div><div id='preview'><div class='buttons'><div class='cancel'></div><div class='ok'></div></div></div>";
        var canvas = "<canvas id='myCanvas' style='display:none;'></canvas>";

        if(!$('#modal').length && !$('#myCanvas').length){
            $('body').append(modal);
            $('body').append(canvas);
        }

        $('body').on('click', selector, function (e) {
            item = $(this);
            var input = item.children('input[type=file]');

            input.on('click', function (e) {
                e.stopPropagation(); 
            });

            aspX = $(this).width();
            aspY = $(this).height();
            file_display_area = $(this);

            input.trigger('click');
        });

        $('body').on('change', selector+' input[type=file]', function (e) {
            imageUpload($('#preview').get(0), $(this));
        });

        $('.ok').click(function () {
            preview();
            $('#preview').delay(100).hide();
            $('#modal').hide();
            jcrop_api.destroy();
            reset();
        });

        //cancel listener
        $('.cancel').click(function (event) {
            $('#preview').delay(100).hide();
            $('#modal').hide();
            jcrop_api.destroy();
            reset();
        });


        function reset() {
            scaled_width = 0;
            scaled_height = 0;
            x1 = 0;
            y1 = 0;
            x2 = 0;
            y2 = 0;
            current_image = null;
            image_filename = null;
            original_data = null;
            aspX = 1;
            aspY = 1;
            file_display_area = null;
        }

        function imageUpload(dropbox, input) {
            var file = input.get(0).files[0];

            var imageType = /image.*/;

            if (file.type.match(imageType)) {
                var reader = new FileReader();
                image_filename = file.name;

                reader.onload = function (e) {
                    // Clear the current image.
                    $('#photo').remove();

                    original_data = reader.result;

                    // Create a new image with image crop functionality
                    current_image = new Image();
                    current_image.src = reader.result;
                    current_image.id = "photo";
                    current_image.style['maxWidth'] = image_dimension_x + 'px';
                    current_image.style['maxHeight'] = image_dimension_y + 'px';
                    current_image.onload = function () {
                        // Calculate scaled image dimensions
                        if (current_image.width > image_dimension_x || current_image.height > image_dimension_y) {
                            if (current_image.width > current_image.height) {
                                scaled_width = image_dimension_x;
                                scaled_height = image_dimension_x * current_image.height / current_image.width;
                            }
                            if (current_image.width < current_image.height) {
                                scaled_height = image_dimension_y;
                                scaled_width = image_dimension_y * current_image.width / current_image.height;
                            }
                            if (current_image.width == current_image.height) {
                                scaled_width = image_dimension_x;
                                scaled_height = image_dimension_y;
                            }
                        }
                        else {
                            scaled_width = current_image.width;
                            scaled_height = current_image.height;
                        }


                        // Position the modal div to the center of the screen
                        $('#modal').css('display', 'block');
                        var window_width = $(window).width() / 2 - scaled_width / 2 + "px";
                        var window_height = $(window).height() / 2 - scaled_height / 2 + "px";

                        // Show image in modal view
                        $("#preview").css("top", window_height);
                        $("#preview").css("left", window_width);
                        $('#preview').show(500);


                        // Calculate selection rect
                        var selection_width = 0;
                        var selection_height = 0;

                        var max_x = Math.floor(scaled_height * aspX / aspY);
                        var max_y = Math.floor(scaled_width * aspY / aspX);


                        if (max_x > scaled_width) {
                            selection_width = scaled_width;
                            selection_height = max_y;
                        }
                        else {
                            selection_width = max_x;
                            selection_height = scaled_height;
                        }

                        ias = $(this).Jcrop({
                            onSelect: showCoords,
                            onChange: showCoords,
                            bgColor: '#747474',
                            bgOpacity: .4,
                            aspectRatio: aspX / aspY,
                            setSelect: [0, 0, selection_width, selection_height]
                        }, function () {
                            jcrop_api = this;
                        });
                    }

                    // Add image to dropbox element
                    dropbox.appendChild(current_image);
                }

                reader.readAsDataURL(file);
            } else {
                notComplete("File not supported!");
            }
        }

        function showCoords(c) {
            x1 = c.x;
            y1 = c.y;
            x2 = c.x2;
            y2 = c.y2;
        }

        function preview() {
            // Set canvas
            var canvas = document.getElementById('myCanvas');
            var context = canvas.getContext('2d');

            // Delete previous image on canvas
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Set selection width and height
            var sw = x2 - x1;
            var sh = y2 - y1;


            // Set image original width and height
            var imgWidth = current_image.naturalWidth;
            var imgHeight = current_image.naturalHeight;

            // Set selection koeficient
            var kw = imgWidth / $("#preview").width();
            var kh = imgHeight / $("#preview").height();

            // Set canvas width and height and draw selection on it
            canvas.width = aspX;
            canvas.height = aspY;
            context.drawImage(current_image, (x1 * kw), (y1 * kh), (sw * kw), (sh * kh), 0, 0, aspX, aspY);

            // Convert canvas image to normal img
            var dataUrl = canvas.toDataURL();
            var imageFoo = document.createElement('img');
            imageFoo.src = dataUrl;

            // Append it to the body element
            $('#preview').delay(100).hide();
            $('#modal').hide();
            file_display_area.children('img').remove();
            file_display_area.append(imageFoo);

            if (onComplete){
                onComplete({                    
                "original": {
                    "filename": image_filename, 
                    "width": current_image.width, 
                    "height": current_image.height 
                },
                  "crop": {
                    "x": (x1 * kw), "y": (y1 * kh), "width": (sw * kw), "height": (sh * kh) 
                  }
                }, item);
            }
        }

        $(window).resize(function () {
            // Position the modal div to the center of the screen
            var window_width = $(window).width() / 2 - scaled_width / 2 + "px";
            var window_height = $(window).height() / 2 - scaled_height / 2 + "px";

            // Show image in modal view
            $("#preview").css("top", window_height);
            $("#preview").css("left", window_width);
        });
    }
}(jQuery));
