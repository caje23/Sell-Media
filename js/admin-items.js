jQuery( document ).ready(function( $ ){

    /**
     * Uploading files
     */
    var file_frame;

    /**
     * Upload button clicked
     * Used on add/edit item page
     * Ajax callback to show uploaded/selected items in meta box
     * Updates hidden input field with new attachment ids
     */
    $(document).on('click', '.sell-media-upload-button', function( event ){

        event.preventDefault();

        var post_id = $(this).data('id');

        if ( file_frame ) {
            file_frame.open();
            return;
        }

        // Create the media frame.
        file_frame = wp.media.frames.file_frame = wp.media({
            title: 'Select Images To Sell',
            description: 'This is the description',
            button: {
              text: 'Sell All Selected Images',
            },
            multiple: 'add'  // Set to true to allow multiple files to be selected
        });

        // When an image is selected, run a callback.
        file_frame.on( 'select', function() {

            var attachments = file_frame.state().get('selection').toJSON();

            /**
             * Since we only want id, title, description and url, we build a new JSON object
             * the current one (attachments) is bloated and causing the bulk updater to fail
             * after ~23 items
             */
            var attachments_array = [];

            $.each( attachments, function( i, item ){
                attachments_array.push({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    url: item.url
                });
            });

            var data = {
                action: "sell_media_upload_callback",
                attachments: attachments_array,
                id: post_id,
                security: $('#sell_media_meta_box_nonce').val()
            };

            //$('.sell-media-upload-list').empty();
            $('.sell-media-ajax-loader').show();

            $.ajax({
                type: "POST",
                url: ajaxurl,
                data: data,
                success: function( msg ){
                    $('.sell-media-ajax-loader').hide();
                    $('.sell-media-upload-list').append( msg );
                    update_files();
                }
            });
        });

        // Finally, open the modal
        file_frame.open();
    });

    /**
     * Remove from file list
     */
    $('.sell-media-delete').on('click', function( event ){
        event.preventDefault();

        // Remove the file
        var id = $(this).data('id');
        $('.sell-media-attachment[data-post_id="' + id +'"]').remove();

        // Update the array
        var array = [];
        $('.sell-media-upload-list li').each(function(){
            array.push($(this).data('post_id'));
        });
        var new_array = array.join(',');

        // Set the new value
        $('#sell-media-files').val(new_array);

    });

    /**
     * Update the file list hidden field
     */
    function update_files(){
        var old_value = $('#sell-media-files').val(),
            arr = old_value === '' ? [] : old_value.split(',');

        $('.sell-media-upload-list li').each(function(){
            arr.push($(this).data('post_id'));
        });

        var new_value = arr.join(',');
        $('#sell-media-files').val(new_value);
    }

    /**
     * Toggle the upload options
     * Used on add/edit item page
     */
    $('.sell-media-upload-options').on('click', function( event ){
        event.preventDefault();
        $(this).text( $(this).text() == $(this).data('show-text') ? $(this).data('hide-text') : $(this).data('show-text'));
        $('#sell-media-upload-show-options').toggle();
    });

    /**
     * Remove disabled property when bulk selector changes
     * Used on add/edit item page
     */
    $('#sell-media-upload-bulk-selector').change(function() {
        var button = $('#sell-media-upload-bulk-processor');
        if ($(this).val()) {
            $(button).prop('disabled', false);
        } else {
            $(button).prop('disabled', true);
        }
    });

    /**
     * Ajax callback to insert attachments in bulk upload directory into WP
     * Used on add/edit item page
     */
    $('#sell-media-upload-bulk-processor').on('click', function( event ){
        event.preventDefault();

        var directory = $('#sell-media-upload-bulk-selector').val(),
            post_id = $('.sell-media-upload-button button').data('id');

        var data = {
                action: "sell_media_upload_bulk_callback",
                dir: directory,
                id: post_id,
                security: $('#sell_media_meta_box_nonce').val()
            };

            $.ajax({
                type: "POST",
                url: ajaxurl,
                data: data,
                success: function( msg ){
                    $('.sell-media-upload-list').append( msg );
                    update_files();
                    //console.log(msg);
                }
            });

    });

});