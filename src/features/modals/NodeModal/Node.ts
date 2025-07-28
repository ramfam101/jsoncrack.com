function handleNodeClick(event, nodeData){
  event.stopPropagation();
  const nodeElement = d3.select(event.currentTarget);
  const existingButton = nodeElement.select('.edit-button');

  if(existingButton.empty()){
    const editButton = nodeElement.append('button')
      .attr('class', 'edit-button')
      .text('Edit')
      .style('position', 'absolute')
      .style('top', '-20px')
      .style('left', '50%')
      .on('click', function(){
        handleEditButtonClick(nodeElement,nodeData);

    });
  }
}