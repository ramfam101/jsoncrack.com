function handleEditButtonClick(nodeElement, nodData){
  const currentValue = nodeData.value;
  nodeElement.html('');

  const inputField = nodeElement.append('input')
    .attr('type', 'text')
    .attr('value', currentValue)
    .style('width', '100px');

  const saveButton = nodeElement.append('button')
    .text('Save')
    .on('click', function()){
    const newValue = inputField.node().value;
    nodeData.value = newValue;

    nodeElement.html(newValue);
    updateJSONData(nodeData);
  });
}