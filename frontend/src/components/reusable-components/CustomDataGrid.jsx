import React from 'react'
import Box from '@mui/material/Box'
import { DataGrid, GridToolbar } from '@mui/x-data-grid'

const DataGridComponent = ({
  sx,
  rows,
  columns,
  pageSize = 10,
  hideToolbar = false,
  hideFooter = false,
  pageSizeOptions = [5, 10, 20],
  disableRowSelectionOnClick = false,
  getRowClassName
}) => {
  const dynamicColumns = columns.map(column => ({
    field: column.field,
    headerName: column.headerName,
    flex: 1,
    cellClassName: column.cellClassName,
    renderCell: column.renderCell
      ? (params) => column.renderCell(params)
      : (params) => params.row[column.field]
  }))

  return (
    <Box
      sx={{
        '& .MuiDataGrid-root': {
          boxShadow: 4,
          border: 'none',
          backgroundColor: '#fff'
        },
        '& .MuiDataGrid-cell': {
          borderBottom: 'none'
        },
        '& .MuiDataGrid-columnHeader': {
          backgroundColor: 'primary.main',
          color: '#fff',
        },
        '& .MuiDataGrid-virtualScroller': {
          backgroundColor: 'background.paper'
        },
        '& .MuiDataGrid-footerContainer': {
          backgroundColor: 'background.paper',
          color: 'secondary.main',
          borderTop: 'none'
        },
        '& .MuiDataGrid-toolbarContainer .MuiButton-text': {
          color: 'secondary.main'
        },
        '& MuiDataGrid-virtualScroller': {
          border: 'none !important'
        },
        '& .category-row': {
          backgroundColor: '#f0f0f0',
          fontWeight: 'bold',
        },
        '& .category-row .MuiDataGrid-cell': {
          borderBottom: 'none',
        },
        ...sx
      }}
    >
      <DataGrid
        rows={rows}
        columns={dynamicColumns}
        slots={hideToolbar ? {} : { toolbar: GridToolbar }}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: pageSize
            }
          }
        }}
        hideFooter={hideFooter}
        pageSizeOptions={pageSizeOptions}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        getRowId={(row) => row.id || row._id}
        getRowClassName={getRowClassName}
        autoHeight
      />
    </Box>
  )
}

export default DataGridComponent
